// src/pages/api/rfp/parse.ts
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { promisify } from "util";
import { assertPermission, PERMS } from "@/lib/rbac";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      // Removed application/msword (.doc) as mammoth only supports .docx
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

const uploadMiddleware = promisify(upload.single('file'));

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: false, // Disable default body parser for file uploads
  },
};

interface ParsedRFP {
  scope: string;
  dueDate: string | null;
  walkthrough: string | null;
  insurance: string | null;
  bond: string | null;
  checklist: string[];
  summary: string;
  talkingPoints: string[];
}

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  } else if (file.mimetype.includes('word') || file.mimetype.includes('document')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } else {
    throw new Error('Unsupported file type');
  }
}

async function parseRFPWithAI(text: string, useAI: boolean = false): Promise<ParsedRFP> {
  // Basic parsing first (always done)
  const basicPrompt = `
    Parse this RFP document and extract key information. Return a JSON object with the following structure:
    {
      "scope": "Brief description of work scope",
      "dueDate": "Due date if found (YYYY-MM-DD format or null)",
      "walkthrough": "Walkthrough/site visit information or null",
      "insurance": "Insurance requirements or null", 
      "bond": "Bond requirements or null",
      "checklist": ["item1", "item2", "item3"], // Key requirements as actionable checklist items
      "summary": "Brief 2-3 sentence summary of the RFP"
    }

    Focus on janitorial/cleaning service requirements. Extract specific details about:
    - Building size, frequency, special requirements
    - Pre-bid meetings or site visits
    - Insurance amounts and types required
    - Performance/bid bond requirements
    - Submission deadlines and format

    RFP Text:
    ${text.slice(0, 8000)} // Limit to avoid token limits
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert at analyzing RFP documents for cleaning and janitorial services. Extract key bid requirements and create actionable checklists."
      },
      {
        role: "user",
        content: basicPrompt
      }
    ],
    response_format: { type: "json_object" },
  });

  let parsed: ParsedRFP = JSON.parse(response.choices[0].message.content || '{}');

  // Enhanced AI analysis if requested
  if (useAI) {
    const enhancedPrompt = `
      Based on this RFP analysis, provide enhanced talking points for the bid proposal.
      Return a JSON object with:
      {
        "talkingPoints": ["point1", "point2", "point3"] // Strategic talking points to differentiate our bid
      }

      Focus on:
      - Unique value propositions for this specific RFP
      - Addressing potential concerns or challenges
      - Highlighting relevant experience or capabilities
      - Competitive advantages

      Original Analysis: ${JSON.stringify(parsed)}
      RFP Text: ${text.slice(0, 4000)}
    `;

    const enhancedResponse = await openai.chat.completions.create({
      model: "gpt-5", 
      messages: [
        {
          role: "system",
          content: "You are a bid strategy expert for cleaning services. Provide strategic insights and competitive advantages."
        },
        {
          role: "user", 
          content: enhancedPrompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const enhanced = JSON.parse(enhancedResponse.choices[0].message.content || '{}');
    parsed.talkingPoints = enhanced.talkingPoints || [];
  } else {
    parsed.talkingPoints = [];
  }

  return parsed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    // Check permissions
    if (!(await assertPermission(req, res, PERMS.LEAD_UPDATE))) return;

    // Handle file upload
    await uploadMiddleware(req as any, res as any);
    const file = (req as any).file as Express.Multer.File;
    
    if (!file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    // Extract useAI flag from form data
    const useAI = (req as any).body?.useAI === 'true';

    // Extract text from file
    const text = await extractTextFromFile(file);
    
    if (!text || text.trim().length < 100) {
      return res.status(400).json({ ok: false, error: 'Could not extract meaningful text from file' });
    }

    // Parse with AI
    let parsed: ParsedRFP;
    try {
      parsed = await parseRFPWithAI(text, useAI);
    } catch (aiError: any) {
      console.error('AI parsing failed:', aiError);
      return res.status(500).json({ 
        ok: false, 
        error: 'AI parsing failed: ' + (aiError.message || 'Unknown error')
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        // Flatten the parsed data to match component expectations
        ...parsed,
        originalText: text,
        filename: file.originalname,
        size: file.size,
        processedAt: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('RFP parsing error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to parse RFP' 
    });
  }
}