/**
 * 🏭 INDUSTRY TEMPLATES (DECLARATIVE)
 * 
 * Industry templates (declarative) for GitHub issue #7
 * Acceptance Criteria: Selecting industry alters enabled features/forms without code duplication.
 * Phase:1 Area:customization Priority:medium
 */

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'construction' | 'professional-services' | 'healthcare' | 'retail' | 'manufacturing' | 'technology' | 'other';
  
  // Feature Configuration
  features: {
    [featureKey: string]: {
      enabled: boolean;
      config?: Record<string, any>;
    };
  };
  
  // Form Customizations
  forms: {
    [formKey: string]: {
      fields: FormFieldConfig[];
      validation?: Record<string, any>;
      layout?: 'single-column' | 'two-column' | 'grid';
    };
  };
  
  // Workflow Definitions
  workflows: {
    [workflowKey: string]: {
      stages: WorkflowStage[];
      automations?: WorkflowAutomation[];
    };
  };
  
  // UI Customizations
  ui: {
    terminology: Record<string, string>; // Rename UI elements
    branding: {
      primaryColor: string;
      secondaryColor: string;
      logoStyle: 'bold' | 'professional' | 'clean' | 'modern' | 'default';
    };
    navigation: {
      primaryLinks: NavigationLink[];
      secondaryLinks: NavigationLink[];
    };
  };
  
  // Data Seeding
  seedData: {
    leadSources: SeedLeadSource[];
    jobTemplates: SeedJobTemplate[];
    customFields: SeedCustomField[];
  };
}

export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'multiselect' | 'textarea' | 'date' | 'checkbox' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string; // Custom validation function name
  };
  options?: Array<{ value: string; label: string }>; // For select/multiselect
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
}

export interface WorkflowStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  automations?: string[]; // Automation IDs to trigger
  requiredFields?: string[];
  approvalRequired?: boolean;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  trigger: 'stage_enter' | 'stage_exit' | 'field_change' | 'time_based';
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    type: 'email' | 'notification' | 'field_update' | 'create_task' | 'webhook';
    config: Record<string, any>;
  }>;
}

export interface NavigationLink {
  href: string;
  label: string;
  icon?: string;
}

export interface SeedLeadSource {
  name: string;
  type: string;
  active: boolean;
}

export interface SeedJobTemplate {
  name: string;
  description: string;
  estimatedHours: number;
  category?: string;
}

export interface SeedCustomField {
  entityType: 'lead' | 'job' | 'customer' | 'invoice';
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

/**
 * Industry Template Registry
 */
export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  construction: {
    id: 'construction',
    name: 'Construction & Contracting',
    description: 'Comprehensive solution for construction companies, contractors, and home improvement services',
    category: 'construction',
    
    features: {
      projectManagement: { enabled: true },
      equipmentTracking: { enabled: true },
      safetyCompliance: { enabled: true },
      materialOrdering: { enabled: true },
      permitTracking: { enabled: true },
      subcontractorManagement: { enabled: true },
      progressPhotos: { enabled: true },
      qualityControl: { enabled: true }
    },
    
    forms: {
      lead: {
        fields: [
          { name: 'projectType', type: 'select', label: 'Project Type', required: true, 
            options: [
              { value: 'residential', label: 'Residential' },
              { value: 'commercial', label: 'Commercial' },
              { value: 'renovation', label: 'Renovation' },
              { value: 'new_construction', label: 'New Construction' }
            ]
          },
          { name: 'propertyType', type: 'select', label: 'Property Type', required: true,
            options: [
              { value: 'single_family', label: 'Single Family Home' },
              { value: 'multi_family', label: 'Multi-Family' },
              { value: 'office', label: 'Office Building' },
              { value: 'retail', label: 'Retail Space' }
            ]
          },
          { name: 'projectSize', type: 'select', label: 'Project Size', required: true,
            options: [
              { value: 'small', label: 'Small (Under $50K)' },
              { value: 'medium', label: 'Medium ($50K - $200K)' },
              { value: 'large', label: 'Large ($200K+)' }
            ]
          },
          { name: 'timeline', type: 'select', label: 'Desired Timeline', required: false,
            options: [
              { value: 'asap', label: 'ASAP' },
              { value: '1_month', label: 'Within 1 Month' },
              { value: '3_months', label: 'Within 3 Months' },
              { value: '6_months', label: 'Within 6 Months' },
              { value: 'flexible', label: 'Flexible' }
            ]
          },
          { name: 'permitRequired', type: 'checkbox', label: 'Permits Required', required: false },
          { name: 'siteAddress', type: 'textarea', label: 'Project Site Address', required: true },
          { name: 'projectDescription', type: 'textarea', label: 'Project Description', required: true }
        ],
        layout: 'two-column'
      },
      
      job: {
        fields: [
          { name: 'workOrderNumber', type: 'text', label: 'Work Order #', required: true },
          { name: 'crew', type: 'multiselect', label: 'Assigned Crew', required: true },
          { name: 'equipment', type: 'multiselect', label: 'Required Equipment', required: false },
          { name: 'materials', type: 'textarea', label: 'Materials List', required: false },
          { name: 'safetyRequirements', type: 'multiselect', label: 'Safety Requirements', required: true,
            options: [
              { value: 'hard_hat', label: 'Hard Hat' },
              { value: 'safety_vest', label: 'Safety Vest' },
              { value: 'steel_toed_boots', label: 'Steel-Toed Boots' },
              { value: 'fall_protection', label: 'Fall Protection' },
              { value: 'eye_protection', label: 'Eye Protection' }
            ]
          },
          { name: 'permitNumbers', type: 'text', label: 'Permit Numbers', required: false },
          { name: 'inspectionRequired', type: 'checkbox', label: 'Inspection Required', required: false }
        ],
        layout: 'two-column'
      }
    },
    
    workflows: {
      leadToProject: {
        stages: [
          { id: 'inquiry', name: 'Initial Inquiry', order: 1 },
          { id: 'site_visit', name: 'Site Visit & Assessment', order: 2, requiredFields: ['siteAddress'] },
          { id: 'estimate', name: 'Estimate Preparation', order: 3 },
          { id: 'proposal', name: 'Proposal Presentation', order: 4 },
          { id: 'contract', name: 'Contract Negotiation', order: 5, approvalRequired: true },
          { id: 'permits', name: 'Permit Application', order: 6 },
          { id: 'execution', name: 'Project Execution', order: 7 }
        ],
        automations: [
          {
            id: 'site_visit_reminder',
            name: 'Site Visit Reminder',
            trigger: 'stage_enter',
            actions: [
              {
                type: 'email',
                config: {
                  template: 'site_visit_confirmation',
                  to: 'customer',
                  subject: 'Site Visit Scheduled'
                }
              }
            ]
          }
        ]
      }
    },
    
    ui: {
      terminology: {
        'leads': 'Projects',
        'jobs': 'Work Orders',
        'workforce': 'Crew',
        'customers': 'Property Owners'
      },
      branding: {
        primaryColor: '#FF6B35',
        secondaryColor: '#004E89',
        logoStyle: 'bold'
      },
      navigation: {
        primaryLinks: [
          { href: '/projects', label: 'Projects', icon: 'building' },
          { href: '/work-orders', label: 'Work Orders', icon: 'clipboard' },
          { href: '/crew', label: 'Crew Management', icon: 'users' },
          { href: '/equipment', label: 'Equipment', icon: 'truck' },
          { href: '/materials', label: 'Materials', icon: 'package' }
        ],
        secondaryLinks: [
          { href: '/permits', label: 'Permits', icon: 'file-text' },
          { href: '/safety', label: 'Safety', icon: 'shield' },
          { href: '/inspections', label: 'Inspections', icon: 'check-circle' }
        ]
      }
    },
    
    seedData: {
      leadSources: [
        { name: 'Referrals', type: 'REFERRAL', active: true },
        { name: 'Home Shows', type: 'EVENT', active: true },
        { name: 'Online Ads', type: 'DIGITAL', active: true },
        { name: 'Contractor Network', type: 'PARTNER', active: true },
        { name: 'Door-to-Door', type: 'DIRECT', active: true }
      ],
      jobTemplates: [
        { name: 'Site Survey', description: 'Initial site assessment and measurements', estimatedHours: 4, category: 'assessment' },
        { name: 'Foundation Work', description: 'Foundation preparation and pouring', estimatedHours: 40, category: 'structural' },
        { name: 'Framing', description: 'Structural framing and rough carpentry', estimatedHours: 80, category: 'structural' },
        { name: 'Electrical Rough-In', description: 'Electrical wiring installation', estimatedHours: 24, category: 'electrical' },
        { name: 'Plumbing Rough-In', description: 'Plumbing installation', estimatedHours: 32, category: 'plumbing' },
        { name: 'Insulation', description: 'Insulation installation', estimatedHours: 16, category: 'insulation' },
        { name: 'Drywall', description: 'Drywall installation and finishing', estimatedHours: 48, category: 'finishing' },
        { name: 'Flooring', description: 'Floor installation', estimatedHours: 32, category: 'finishing' },
        { name: 'Final Inspection', description: 'Final quality control inspection', estimatedHours: 4, category: 'inspection' }
      ],
      customFields: [
        { entityType: 'lead', name: 'permit_required', type: 'boolean', label: 'Permits Required', required: false },
        { entityType: 'lead', name: 'hoa_approval', type: 'boolean', label: 'HOA Approval Needed', required: false },
        { entityType: 'job', name: 'crew_size', type: 'number', label: 'Crew Size', required: true },
        { entityType: 'job', name: 'equipment_list', type: 'text', label: 'Equipment List', required: false }
      ]
    }
  },
  
  // Additional industry templates would be defined here...
  // For brevity, I'll add a simplified professional services template
  
  'professional-services': {
    id: 'professional-services',
    name: 'Professional Services',
    description: 'Tailored for consulting, legal, accounting, and other professional service firms',
    category: 'professional-services',
    
    features: {
      timeTracking: { enabled: true },
      clientPortal: { enabled: true },
      documentManagement: { enabled: true },
      projectTemplates: { enabled: true },
      billingIntegration: { enabled: true }
    },
    
    forms: {
      lead: {
        fields: [
          { name: 'serviceType', type: 'select', label: 'Service Type', required: true,
            options: [
              { value: 'consulting', label: 'Consulting' },
              { value: 'legal', label: 'Legal Services' },
              { value: 'accounting', label: 'Accounting' },
              { value: 'marketing', label: 'Marketing' }
            ]
          },
          { name: 'projectScope', type: 'textarea', label: 'Project Scope', required: true },
          { name: 'budget', type: 'select', label: 'Budget Range', required: false,
            options: [
              { value: 'under_10k', label: 'Under $10K' },
              { value: '10k_50k', label: '$10K - $50K' },
              { value: '50k_100k', label: '$50K - $100K' },
              { value: 'over_100k', label: 'Over $100K' }
            ]
          }
        ],
        layout: 'single-column'
      }
    },
    
    workflows: {
      leadToProject: {
        stages: [
          { id: 'consultation', name: 'Initial Consultation', order: 1 },
          { id: 'proposal', name: 'Proposal Development', order: 2 },
          { id: 'contract', name: 'Contract Execution', order: 3 },
          { id: 'delivery', name: 'Service Delivery', order: 4 }
        ]
      }
    },
    
    ui: {
      terminology: {
        'leads': 'Prospects',
        'jobs': 'Engagements',
        'workforce': 'Team'
      },
      branding: {
        primaryColor: '#2E86AB',
        secondaryColor: '#A23B72',
        logoStyle: 'professional'
      },
      navigation: {
        primaryLinks: [
          { href: '/prospects', label: 'Prospects', icon: 'users' },
          { href: '/engagements', label: 'Engagements', icon: 'briefcase' },
          { href: '/time-tracking', label: 'Time Tracking', icon: 'clock' },
          { href: '/documents', label: 'Documents', icon: 'file' }
        ],
        secondaryLinks: [
          { href: '/billing', label: 'Billing', icon: 'dollar-sign' },
          { href: '/reports', label: 'Reports', icon: 'bar-chart' }
        ]
      }
    },
    
    seedData: {
      leadSources: [
        { name: 'Client Referrals', type: 'REFERRAL', active: true },
        { name: 'LinkedIn', type: 'SOCIAL', active: true },
        { name: 'Industry Events', type: 'EVENT', active: true },
        { name: 'Content Marketing', type: 'DIGITAL', active: true }
      ],
      jobTemplates: [
        { name: 'Initial Consultation', description: 'Client discovery and needs assessment', estimatedHours: 2 },
        { name: 'Strategy Development', description: 'Strategic planning and roadmap creation', estimatedHours: 16 },
        { name: 'Implementation', description: 'Solution implementation and deployment', estimatedHours: 40 }
      ],
      customFields: [
        { entityType: 'lead', name: 'referral_source', type: 'text', label: 'Referral Source', required: false },
        { entityType: 'job', name: 'hourly_rate', type: 'number', label: 'Hourly Rate', required: true }
      ]
    }
  }
};

/**
 * Get industry template by ID
 */
export function getIndustryTemplate(industryId: string): IndustryTemplate | null {
  return INDUSTRY_TEMPLATES[industryId] || null;
}

/**
 * Get all available industry templates
 */
export function getAllIndustryTemplates(): IndustryTemplate[] {
  return Object.values(INDUSTRY_TEMPLATES);
}

/**
 * Apply industry template to organization configuration
 */
export function applyIndustryTemplate(industryId: string, baseConfig: any = {}): any {
  const template = getIndustryTemplate(industryId);
  if (!template) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    industry: industryId,
    features: { ...baseConfig.features, ...template.features },
    forms: { ...baseConfig.forms, ...template.forms },
    workflows: { ...baseConfig.workflows, ...template.workflows },
    ui: { ...baseConfig.ui, ...template.ui },
    seedData: { ...baseConfig.seedData, ...template.seedData }
  };
}
