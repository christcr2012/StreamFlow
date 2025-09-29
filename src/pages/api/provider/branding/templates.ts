// src/pages/api/provider/branding/templates.ts

/**
 * 🎨 BRAND TEMPLATES API
 * 
 * API for managing brand templates and presets.
 * Provides pre-designed branding templates for quick client setup.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateProvider } from '@/lib/provider-auth';

interface BrandTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  category: 'professional' | 'modern' | 'classic' | 'creative';
  fontFamily: string;
  isPopular?: boolean;
}

// Pre-defined brand templates
const brandTemplates: BrandTemplate[] = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    description: 'Clean and trustworthy design perfect for corporate clients',
    preview: '/templates/professional-blue.png',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    },
    category: 'professional',
    fontFamily: 'Inter',
    isPopular: true
  },
  {
    id: 'modern-green',
    name: 'Modern Green',
    description: 'Fresh and innovative design for tech-forward companies',
    preview: '/templates/modern-green.png',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399'
    },
    category: 'modern',
    fontFamily: 'Poppins',
    isPopular: true
  },
  {
    id: 'classic-navy',
    name: 'Classic Navy',
    description: 'Timeless and elegant design for established businesses',
    preview: '/templates/classic-navy.png',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3730a3',
      accent: '#6366f1'
    },
    category: 'classic',
    fontFamily: 'Roboto'
  },
  {
    id: 'creative-purple',
    name: 'Creative Purple',
    description: 'Bold and artistic design for creative agencies',
    preview: '/templates/creative-purple.png',
    colors: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa'
    },
    category: 'creative',
    fontFamily: 'Montserrat'
  },
  {
    id: 'professional-gray',
    name: 'Professional Gray',
    description: 'Sophisticated monochrome design for consulting firms',
    preview: '/templates/professional-gray.png',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#9ca3af'
    },
    category: 'professional',
    fontFamily: 'Inter'
  },
  {
    id: 'modern-orange',
    name: 'Modern Orange',
    description: 'Energetic and vibrant design for dynamic startups',
    preview: '/templates/modern-orange.png',
    colors: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#fdba74'
    },
    category: 'modern',
    fontFamily: 'Lato'
  },
  {
    id: 'classic-burgundy',
    name: 'Classic Burgundy',
    description: 'Rich and luxurious design for premium services',
    preview: '/templates/classic-burgundy.png',
    colors: {
      primary: '#991b1b',
      secondary: '#dc2626',
      accent: '#f87171'
    },
    category: 'classic',
    fontFamily: 'Open Sans'
  },
  {
    id: 'creative-teal',
    name: 'Creative Teal',
    description: 'Unique and refreshing design for innovative companies',
    preview: '/templates/creative-teal.png',
    colors: {
      primary: '#0f766e',
      secondary: '#14b8a6',
      accent: '#5eead4'
    },
    category: 'creative',
    fontFamily: 'Poppins'
  },
  {
    id: 'professional-slate',
    name: 'Professional Slate',
    description: 'Modern minimalist design for tech companies',
    preview: '/templates/professional-slate.png',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#64748b'
    },
    category: 'professional',
    fontFamily: 'Inter',
    isPopular: true
  },
  {
    id: 'modern-pink',
    name: 'Modern Pink',
    description: 'Playful and contemporary design for lifestyle brands',
    preview: '/templates/modern-pink.png',
    colors: {
      primary: '#be185d',
      secondary: '#ec4899',
      accent: '#f9a8d4'
    },
    category: 'modern',
    fontFamily: 'Montserrat'
  },
  {
    id: 'classic-forest',
    name: 'Classic Forest',
    description: 'Natural and grounded design for outdoor businesses',
    preview: '/templates/classic-forest.png',
    colors: {
      primary: '#166534',
      secondary: '#22c55e',
      accent: '#86efac'
    },
    category: 'classic',
    fontFamily: 'Roboto'
  },
  {
    id: 'creative-sunset',
    name: 'Creative Sunset',
    description: 'Warm gradient design for hospitality and wellness',
    preview: '/templates/creative-sunset.png',
    colors: {
      primary: '#c2410c',
      secondary: '#f97316',
      accent: '#fed7aa'
    },
    category: 'creative',
    fontFamily: 'Lato'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Provider authentication
    const providerAuth = await authenticateProvider(req);
    if (!providerAuth) {
      return res.status(401).json({
        ok: false,
        error: 'Provider authentication required'
      });
    }

    if (req.method === 'GET') {
      return handleGetTemplates(req, res);
    }

    if (req.method === 'POST') {
      return handleCreateTemplate(req, res);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Brand templates API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get brand templates
 */
async function handleGetTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, popular } = req.query;

    let filteredTemplates = brandTemplates;

    // Filter by category
    if (category && typeof category === 'string') {
      filteredTemplates = filteredTemplates.filter(
        template => template.category === category
      );
    }

    // Filter by popularity
    if (popular === 'true') {
      filteredTemplates = filteredTemplates.filter(
        template => template.isPopular
      );
    }

    // Sort templates: popular first, then alphabetically
    filteredTemplates.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json({
      ok: true,
      templates: filteredTemplates,
      totalCount: filteredTemplates.length,
      categories: ['professional', 'modern', 'classic', 'creative'],
      popularCount: brandTemplates.filter(t => t.isPopular).length
    });

  } catch (error) {
    console.error('Error fetching brand templates:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch brand templates'
    });
  }
}

/**
 * Create custom brand template
 */
async function handleCreateTemplate(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, colors, category, fontFamily } = req.body;

    if (!name || !colors || !category) {
      return res.status(400).json({
        ok: false,
        error: 'Name, colors, and category are required'
      });
    }

    const newTemplate: BrandTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description: description || '',
      preview: '/templates/custom-preview.png',
      colors: {
        primary: colors.primary || '#22c55e',
        secondary: colors.secondary || '#16a34a',
        accent: colors.accent || '#15803d'
      },
      category: category as BrandTemplate['category'],
      fontFamily: fontFamily || 'Inter'
    };

    // In a real implementation, you would save this to a database
    // For now, we'll just return the created template
    
    return res.status(201).json({
      ok: true,
      template: newTemplate,
      message: 'Custom brand template created successfully'
    });

  } catch (error) {
    console.error('Error creating brand template:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create brand template'
    });
  }
}

/**
 * Get template usage statistics
 */
export function getTemplateStats() {
  const categoryStats = brandTemplates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTemplates: brandTemplates.length,
    popularTemplates: brandTemplates.filter(t => t.isPopular).length,
    categoryBreakdown: categoryStats,
    mostPopularCategory: Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'professional'
  };
}

/**
 * Generate template preview URL
 */
export function generateTemplatePreview(template: BrandTemplate): string {
  // In a real implementation, this would generate an actual preview image
  // For now, return a placeholder URL
  return `/api/templates/preview/${template.id}`;
}
