import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTemplateSchema = z.object({
  templateType: z.enum(['invoice_sent', 'payment_received', 'job_status_update', 'job_completed']),
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
  textBody: z.string().min(1),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { orgId: authContext.orgId },
      orderBy: { templateType: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    // Check if template already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: {
        orgId_templateType: {
          orgId: authContext.orgId,
          templateType: data.templateType,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Template already exists for this type' }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        orgId: authContext.orgId,
        ...data,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

