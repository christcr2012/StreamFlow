// src/pages/api/provider/branding.ts

/**
 * 🎨 PROVIDER BRANDING API
 * 
 * API for managing white-label branding across client organizations.
 * Provides comprehensive brand configuration and asset management.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateProvider } from '@/lib/provider-auth';
import { prisma } from '@/lib/prisma';

interface BrandConfig {
  id: string;
  clientId: string;
  clientName: string;
  brandName: string;
  domain?: string;
  customDomain?: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  emailTemplates: {
    welcome: string;
    invoice: string;
    notification: string;
  };
  socialLinks: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  isActive: boolean;
  lastUpdated: string;
}

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
      return handleGetBrandConfigs(req, res);
    }

    if (req.method === 'POST') {
      return handleCreateBrandConfig(req, res);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Provider branding API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get all brand configurations
 */
async function handleGetBrandConfigs(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all organizations with their brand configurations
    const organizations = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
        brandConfig: true,

        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const brandConfigs: BrandConfig[] = organizations.map(org => {
      const brandConfig = org.brandConfig as any || {};
      
      return {
        id: `brand_${org.id}`,
        clientId: org.id,
        clientName: org.name,
        brandName: brandConfig.name || org.name,
        domain: `${org.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.streamflow.app`,
        customDomain: undefined, // TODO: Add customDomain field to Org model
        logo: brandConfig.logo || undefined,
        favicon: brandConfig.favicon || undefined,
        primaryColor: brandConfig.primaryColor || '#22c55e',
        secondaryColor: brandConfig.secondaryColor || '#16a34a',
        accentColor: brandConfig.accentColor || '#15803d',
        fontFamily: brandConfig.fontFamily || 'Inter',
        emailTemplates: {
          welcome: brandConfig.emailTemplates?.welcome || getDefaultEmailTemplate('welcome'),
          invoice: brandConfig.emailTemplates?.invoice || getDefaultEmailTemplate('invoice'),
          notification: brandConfig.emailTemplates?.notification || getDefaultEmailTemplate('notification')
        },
        socialLinks: {
          website: brandConfig.socialLinks?.website,
          linkedin: brandConfig.socialLinks?.linkedin,
          twitter: brandConfig.socialLinks?.twitter,
          facebook: brandConfig.socialLinks?.facebook
        },
        contactInfo: {
          phone: brandConfig.contactInfo?.phone,
          email: brandConfig.contactInfo?.email,
          address: brandConfig.contactInfo?.address
        },
        isActive: true,
        lastUpdated: org.updatedAt.toISOString()
      };
    });

    return res.status(200).json({
      ok: true,
      brandConfigs,
      totalCount: brandConfigs.length
    });

  } catch (error) {
    console.error('Error fetching brand configurations:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch brand configurations'
    });
  }
}

/**
 * Create new brand configuration
 */
async function handleCreateBrandConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { clientId, brandConfig } = req.body;

    if (!clientId || !brandConfig) {
      return res.status(400).json({
        ok: false,
        error: 'Client ID and brand configuration are required'
      });
    }

    // Update organization with brand configuration
    const updatedOrg = await prisma.org.update({
      where: { id: clientId },
      data: {
        brandConfig: brandConfig,
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      ok: true,
      message: 'Brand configuration created successfully',
      brandConfig: {
        id: `brand_${updatedOrg.id}`,
        clientId: updatedOrg.id,
        ...brandConfig,
        lastUpdated: updatedOrg.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating brand configuration:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create brand configuration'
    });
  }
}

/**
 * Get default email templates
 */
function getDefaultEmailTemplate(type: 'welcome' | 'invoice' | 'notification'): string {
  const templates = {
    welcome: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to {{brandName}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            {{#if logo}}
            <img src="{{logo}}" alt="{{brandName}}" style="max-height: 60px;">
            {{else}}
            <h1 style="color: {{primaryColor}};">{{brandName}}</h1>
            {{/if}}
        </div>
        
        <h2>Welcome to {{brandName}}!</h2>
        
        <p>Thank you for joining {{brandName}}. We're excited to have you on board!</p>
        
        <p>Your account has been successfully created and you can now access all our features.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Get Started
            </a>
        </div>
        
        <p>If you have any questions, feel free to contact us at {{contactEmail}}.</p>
        
        <p>Best regards,<br>The {{brandName}} Team</p>
    </div>
</body>
</html>`,

    invoice: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice from {{brandName}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            {{#if logo}}
            <img src="{{logo}}" alt="{{brandName}}" style="max-height: 60px;">
            {{else}}
            <h1 style="color: {{primaryColor}};">{{brandName}}</h1>
            {{/if}}
        </div>
        
        <h2>Invoice #{{invoiceNumber}}</h2>
        
        <p>Dear {{customerName}},</p>
        
        <p>Please find your invoice attached. The total amount due is <strong>{{totalAmount}}</strong>.</p>
        
        <p><strong>Due Date:</strong> {{dueDate}}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{paymentUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                Pay Now
            </a>
        </div>
        
        <p>If you have any questions about this invoice, please contact us at {{contactEmail}}.</p>
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>The {{brandName}} Team</p>
    </div>
</body>
</html>`,

    notification: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Notification from {{brandName}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            {{#if logo}}
            <img src="{{logo}}" alt="{{brandName}}" style="max-height: 60px;">
            {{else}}
            <h1 style="color: {{primaryColor}};">{{brandName}}</h1>
            {{/if}}
        </div>
        
        <h2>{{notificationTitle}}</h2>
        
        <p>Hello {{userName}},</p>
        
        <p>{{notificationMessage}}</p>
        
        {{#if actionUrl}}
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{actionUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                {{actionText}}
            </a>
        </div>
        {{/if}}
        
        <p>If you have any questions, please contact us at {{contactEmail}}.</p>
        
        <p>Best regards,<br>The {{brandName}} Team</p>
    </div>
</body>
</html>`
  };

  return templates[type];
}
