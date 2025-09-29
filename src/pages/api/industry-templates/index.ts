/**
 * 🏭 INDUSTRY TEMPLATES API
 * 
 * API endpoint for managing industry templates
 * Supports GitHub issue #7: Industry templates (declarative)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllIndustryTemplates, getIndustryTemplate, applyIndustryTemplate } from '@/lib/industry-templates';
import { withSpaceGuard, SPACE_GUARDS } from '@/lib/space-guards';
import { consolidatedAudit } from '@/lib/consolidated-audit';

interface IndustryTemplatesResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<IndustryTemplatesResponse>) {
  try {
    if (req.method === 'GET') {
      const { industryId, action } = req.query;

      if (action === 'apply' && typeof industryId === 'string') {
        // Apply industry template to base configuration
        const baseConfig = req.body || {};
        const appliedConfig = applyIndustryTemplate(industryId, baseConfig);
        
        // Log the template application
        await consolidatedAudit.logSystemAdmin(
          'INDUSTRY_TEMPLATE_APPLIED',
          'provider@streamflow.com',
          'PROVIDER',
          'CONFIGURATION',
          {
            ipAddress: req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'] as string
          },
          {
            industryId,
            templateApplied: true,
            featuresEnabled: Object.keys(appliedConfig.features || {}).filter(key => appliedConfig.features[key]?.enabled),
            timestamp: new Date().toISOString()
          }
        );

        return res.status(200).json({
          success: true,
          data: {
            industryId,
            appliedConfig,
            message: 'Industry template applied successfully'
          }
        });
      }

      if (typeof industryId === 'string') {
        // Get specific industry template
        const template = getIndustryTemplate(industryId);
        
        if (!template) {
          return res.status(404).json({
            success: false,
            error: `Industry template not found: ${industryId}`
          });
        }

        return res.status(200).json({
          success: true,
          data: template
        });
      }

      // Get all industry templates
      const templates = getAllIndustryTemplates();
      
      return res.status(200).json({
        success: true,
        data: {
          templates,
          count: templates.length,
          categories: [...new Set(templates.map(t => t.category))]
        }
      });
    }

    if (req.method === 'POST') {
      // Preview industry template application
      const { industryId, baseConfig = {} } = req.body;

      if (!industryId) {
        return res.status(400).json({
          success: false,
          error: 'industryId is required'
        });
      }

      const template = getIndustryTemplate(industryId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: `Industry template not found: ${industryId}`
        });
      }

      const appliedConfig = applyIndustryTemplate(industryId, baseConfig);
      
      // Log the template preview
      await consolidatedAudit.logSystemAdmin(
        'INDUSTRY_TEMPLATE_PREVIEWED',
        'provider@streamflow.com',
        'PROVIDER',
        'CONFIGURATION',
        {
          ipAddress: req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] as string
        },
        {
          industryId,
          templateName: template.name,
          previewGenerated: true,
          timestamp: new Date().toISOString()
        }
      );

      return res.status(200).json({
        success: true,
        data: {
          template,
          appliedConfig,
          preview: {
            featuresEnabled: Object.keys(template.features).filter(key => template.features[key].enabled),
            formsCustomized: Object.keys(template.forms),
            workflowsConfigured: Object.keys(template.workflows),
            uiCustomizations: {
              terminology: template.ui.terminology,
              branding: template.ui.branding,
              navigationLinks: template.ui.navigation.primaryLinks.length + template.ui.navigation.secondaryLinks.length
            },
            seedDataAvailable: {
              leadSources: template.seedData.leadSources.length,
              jobTemplates: template.seedData.jobTemplates.length,
              customFields: template.seedData.customFields.length
            }
          }
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Industry Templates API Error:', error);
    
    // Log the error
    await consolidatedAudit.logSystemAdmin(
      'INDUSTRY_TEMPLATE_ERROR',
      'provider@streamflow.com',
      'PROVIDER',
      'API',
      {
        ipAddress: req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'] as string
      },
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: req.method,
        query: req.query,
        timestamp: new Date().toISOString()
      }
    );

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Protect with provider-only access since this is system configuration
export default withSpaceGuard(SPACE_GUARDS.PROVIDER_ONLY)(handler);
