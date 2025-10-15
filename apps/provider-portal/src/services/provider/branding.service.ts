import { prisma } from '@/lib/prisma';
import { safeQuery, calculatePercentage } from '@/lib/utils/query.utils';

/**
 * Branding Service
 * Manages white-label branding configurations for organizations
 */

export interface BrandConfig {
  name?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customDomain?: string;
  emailTemplates?: {
    welcome?: string;
    invoice?: string;
    notification?: string;
  };
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface BrandingTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'modern' | 'classic' | 'creative';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fontFamily: string;
  isPopular?: boolean;
}

// Pre-defined branding templates
export const BRANDING_TEMPLATES: BrandingTemplate[] = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    description: 'Clean and trustworthy design perfect for corporate clients',
    category: 'professional',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
    },
    fontFamily: 'Inter',
    isPopular: true,
  },
  {
    id: 'modern-green',
    name: 'Modern Green',
    description: 'Fresh and innovative design for tech-forward companies',
    category: 'modern',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
    },
    fontFamily: 'Inter',
    isPopular: true,
  },
  {
    id: 'classic-purple',
    name: 'Classic Purple',
    description: 'Elegant and sophisticated design for premium brands',
    category: 'classic',
    colors: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#c084fc',
    },
    fontFamily: 'Georgia',
  },
  {
    id: 'creative-orange',
    name: 'Creative Orange',
    description: 'Bold and energetic design for creative agencies',
    category: 'creative',
    colors: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
    },
    fontFamily: 'Poppins',
  },
  {
    id: 'professional-gray',
    name: 'Professional Gray',
    description: 'Minimalist and modern design for professional services',
    category: 'professional',
    colors: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#9ca3af',
    },
    fontFamily: 'Inter',
  },
  {
    id: 'modern-teal',
    name: 'Modern Teal',
    description: 'Contemporary design with a calming color palette',
    category: 'modern',
    colors: {
      primary: '#0d9488',
      secondary: '#14b8a6',
      accent: '#2dd4bf',
    },
    fontFamily: 'Inter',
  },
];

/**
 * Get all organizations with their branding configurations
 */
export async function getAllBrandingConfigs() {
  const orgs = await safeQuery(
    () => prisma.org.findMany({
      select: {
        id: true,
        name: true,
        brandConfig: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    [],
    'Failed to fetch all branding configurations'
  );

  return orgs.map((org: any) => {
    const brandConfig = (org.brandConfig as BrandConfig) || {};
    return {
      id: org.id,
      name: org.name,
      brandConfig,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  });
}

/**
 * Get branding configuration for a specific organization
 */
export async function getBrandingConfig(orgId: string) {
  const org = await safeQuery(
    () => prisma.org.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        brandConfig: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    null,
    `Failed to fetch branding config for org ${orgId}`
  );

  if (!org) {
    throw new Error('Organization not found');
  }

  const brandConfig = (org.brandConfig as BrandConfig) || {};
  return {
    id: org.id,
    name: org.name,
    brandConfig,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
}

/**
 * Update branding configuration for an organization
 */
export async function updateBrandingConfig(orgId: string, brandConfig: Partial<BrandConfig>) {
  // Get existing config
  const org = await safeQuery(
    () => prisma.org.findUnique({
      where: { id: orgId },
      select: { brandConfig: true },
    }),
    null,
    `Failed to fetch org ${orgId} for branding update`
  );

  if (!org) {
    throw new Error('Organization not found');
  }

  // Merge with existing config
  const existingConfig = (org.brandConfig as BrandConfig) || {};
  const updatedConfig = {
    ...existingConfig,
    ...brandConfig,
    // Deep merge nested objects
    emailTemplates: {
      ...existingConfig.emailTemplates,
      ...brandConfig.emailTemplates,
    },
    socialLinks: {
      ...existingConfig.socialLinks,
      ...brandConfig.socialLinks,
    },
    contactInfo: {
      ...existingConfig.contactInfo,
      ...brandConfig.contactInfo,
    },
  };

  // Update in database
  const updated = await safeQuery(
    () => prisma.org.update({
      where: { id: orgId },
      data: {
        brandConfig: updatedConfig as any,
      },
      select: {
        id: true,
        name: true,
        brandConfig: true,
        updatedAt: true,
      },
    }),
    null,
    `Failed to update branding config for org ${orgId}`
  );

  if (!updated) {
    throw new Error('Failed to update branding configuration');
  }

  return {
    id: updated.id,
    name: updated.name,
    brandConfig: updated.brandConfig as BrandConfig,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Apply a branding template to an organization
 */
export async function applyBrandingTemplate(orgId: string, templateId: string) {
  const template = BRANDING_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const brandConfig: Partial<BrandConfig> = {
    primaryColor: template.colors.primary,
    secondaryColor: template.colors.secondary,
    accentColor: template.colors.accent,
    fontFamily: template.fontFamily,
  };

  return updateBrandingConfig(orgId, brandConfig);
}

/**
 * Get branding statistics
 */
export async function getBrandingStats() {
  const totalOrgs = await safeQuery(
    () => prisma.org.count(),
    0,
    'Failed to count total organizations'
  );

  const orgsWithBranding = await safeQuery(
    () => prisma.org.count({
      where: {
        brandConfig: {
          not: {},
        },
      },
    }),
    0,
    'Failed to count organizations with branding'
  );

  // Count orgs with logos and custom colors by fetching all and filtering
  const allOrgs = await safeQuery(
    () => prisma.org.findMany({
      select: {
        brandConfig: true,
      },
    }),
    [],
    'Failed to fetch organizations for branding stats'
  );

  const orgsWithLogo = allOrgs.filter((org: any) => {
    const config = org.brandConfig as BrandConfig;
    return config && config.logoUrl;
  }).length;

  const orgsWithCustomColors = allOrgs.filter((org: any) => {
    const config = org.brandConfig as BrandConfig;
    return config && config.primaryColor;
  }).length;

  return {
    totalOrgs,
    orgsWithBranding,
    orgsWithLogo,
    orgsWithCustomColors,
    brandingAdoptionRate: calculatePercentage(orgsWithBranding, totalOrgs),
  };
}

/**
 * Get all branding templates
 */
export function getBrandingTemplates() {
  return BRANDING_TEMPLATES;
}

