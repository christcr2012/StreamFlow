// Seed script for feature registry - initial features for AI recommendations
import { PrismaClient, FeatureCategory } from '@prisma/client';

const prisma = new PrismaClient();

const features = [
  // Dashboard Features
  {
    key: 'dashboard.home',
    name: 'Dashboard Overview',
    description: 'Main dashboard with key metrics and quick actions',
    category: 'AI_ANALYTICS',
    defaultEnabled: true,
    discoverability: 'STANDARD',
    helpUrl: '/help/dashboard',
  },
  {
    key: 'dashboard.premium',
    name: 'Premium Dashboard',
    description: 'Advanced analytics and premium features dashboard',
    category: FeatureCategory.AI_ANALYTICS,
    requiresPlan: 'PREMIUM',
    discoverability: 'PROMOTED',
    helpUrl: '/help/premium-dashboard',
  },

  // Lead Management Features
  {
    key: 'leads.list',
    name: 'Lead Management',
    description: 'View and manage all leads in your pipeline',
    category: FeatureCategory.AUTOMATION,
    defaultEnabled: true,
    discoverability: 'STANDARD',
    helpUrl: '/help/leads',
  },
  {
    key: 'leads.create',
    name: 'Create Lead',
    description: 'Add new leads to your sales pipeline',
    category: FeatureCategory.AUTOMATION,
    defaultEnabled: true,
    dependencies: ['leads.list'],
    discoverability: 'STANDARD',
    helpUrl: '/help/leads/create',
  },
  {
    key: 'leads.convert',
    name: 'Lead Conversion',
    description: 'Convert qualified leads into paying customers',
    category: FeatureCategory.AUTOMATION,
    defaultEnabled: true,
    dependencies: ['leads.list', 'clients.list'],
    discoverability: 'PROMOTED',
    helpUrl: '/help/leads/convert',
  },
  {
    key: 'leads.ai-scoring',
    name: 'AI Lead Scoring',
    description: 'Automatically score leads based on conversion probability',
    category: 'AI_ANALYTICS',
    requiresPlan: 'BASE',
    dependencies: ['leads.list'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'lead_volume', operator: 'gte', value: 10 },
        { type: 'conversion_rate', operator: 'lt', value: 0.2 }
      ]
    },
    helpUrl: '/help/ai-scoring',
  },

  // Scheduling Features
  {
    key: 'scheduling.board',
    name: 'Schedule Board',
    description: 'Visual scheduling interface for technicians and jobs',
    category: 'AUTOMATION',
    defaultEnabled: false,
    dependencies: ['jobs.list'],
    discoverability: 'STANDARD',
    recommendWhen: {
      conditions: [
        { type: 'employee_count', operator: 'gte', value: 3 },
        { type: 'job_volume', operator: 'gte', value: 5 }
      ]
    },
    helpUrl: '/help/scheduling',
  },
  {
    key: 'scheduling.auto-assign',
    name: 'Auto-Assignment',
    description: 'Automatically assign jobs to technicians based on skills and availability',
    category: 'AI_ANALYTICS',
    requiresPlan: 'PREMIUM',
    dependencies: ['scheduling.board'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'technician_count', operator: 'gte', value: 5 },
        { type: 'jobs_per_day', operator: 'gte', value: 10 }
      ]
    },
    helpUrl: '/help/auto-assignment',
  },

  // Billing Features
  {
    key: 'billing.invoices',
    name: 'Invoice Management',
    description: 'Create, send, and track customer invoices',
    category: 'AUTOMATION',
    defaultEnabled: true,
    discoverability: 'STANDARD',
    helpUrl: '/help/billing',
  },
  {
    key: 'billing.auto-invoice',
    name: 'Auto-Invoicing',
    description: 'Automatically generate invoices from completed work orders',
    category: 'AUTOMATION',
    dependencies: ['billing.invoices', 'jobs.list'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'completed_jobs', operator: 'gte', value: 20 },
        { type: 'manual_invoices', operator: 'gte', value: 10 }
      ]
    },
    helpUrl: '/help/auto-invoicing',
  },

  // Analytics Features
  {
    key: 'analytics.dashboard',
    name: 'Analytics Dashboard',
    description: 'Business performance metrics and insights',
    category: 'AI_ANALYTICS',
    defaultEnabled: true,
    discoverability: 'STANDARD',
    helpUrl: '/help/analytics',
  },
  {
    key: 'analytics.predictive',
    name: 'Predictive Analytics',
    description: 'AI-powered business forecasting and insights',
    category: 'AI_ANALYTICS',
    requiresPlan: 'PREMIUM',
    dependencies: ['analytics.dashboard'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'data_history_months', operator: 'gte', value: 6 },
        { type: 'revenue_monthly', operator: 'gte', value: 10000 }
      ]
    },
    helpUrl: '/help/predictive-analytics',
  },

  // Client Management Features
  {
    key: 'clients.list',
    name: 'Client Management',
    description: 'Manage customer information and relationship history',
    category: 'AUTOMATION',
    defaultEnabled: true,
    discoverability: 'STANDARD',
    helpUrl: '/help/clients',
  },
  {
    key: 'clients.segments',
    name: 'Client Segmentation',
    description: 'Segment clients by value, behavior, and characteristics',
    category: 'AI_ANALYTICS',
    dependencies: ['clients.list'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'client_count', operator: 'gte', value: 50 },
        { type: 'revenue_diversity', operator: 'gte', value: 0.3 }
      ]
    },
    helpUrl: '/help/client-segmentation',
  },

  // Mobile Features
  {
    key: 'mobile.field-ops',
    name: 'Mobile Field Operations',
    description: 'Mobile app for technicians to manage jobs in the field',
    category: 'MOBILE',
    dependencies: ['jobs.list'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'field_technicians', operator: 'gte', value: 2 },
        { type: 'jobs_per_week', operator: 'gte', value: 10 }
      ]
    },
    helpUrl: '/help/mobile-app',
  },
  {
    key: 'mobile.offline-sync',
    name: 'Offline Sync',
    description: 'Work offline and sync data when connection is restored',
    category: 'MOBILE',
    requiresPlan: 'PREMIUM',
    dependencies: ['mobile.field-ops'],
    discoverability: 'PROMOTED',
    incompatible: ['mobile.basic'],
    helpUrl: '/help/offline-sync',
  },

  // Integration Features
  {
    key: 'integration.accounting',
    name: 'Accounting Integration',
    description: 'Sync with QuickBooks, Xero, and other accounting platforms',
    category: 'INTEGRATION',
    dependencies: ['billing.invoices'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'monthly_invoices', operator: 'gte', value: 25 },
        { type: 'accounting_software', operator: 'exists', value: true }
      ]
    },
    helpUrl: '/help/accounting-integration',
  },
  {
    key: 'integration.payments',
    name: 'Payment Processing',
    description: 'Accept credit cards, ACH, and online payments',
    category: 'INTEGRATION',
    dependencies: ['billing.invoices'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'cash_payments_percent', operator: 'gte', value: 0.3 },
        { type: 'payment_delays_days', operator: 'gte', value: 30 }
      ]
    },
    helpUrl: '/help/payment-processing',
  },

  // Communication Features
  {
    key: 'communication.sms',
    name: 'SMS Notifications',
    description: 'Send automated SMS updates to customers',
    category: 'COMMUNICATION',
    defaultEnabled: false,
    discoverability: 'STANDARD',
    recommendWhen: {
      conditions: [
        { type: 'customer_count', operator: 'gte', value: 25 },
        { type: 'no_show_rate', operator: 'gte', value: 0.15 }
      ]
    },
    helpUrl: '/help/sms-notifications',
  },
  {
    key: 'communication.email-campaigns',
    name: 'Email Marketing',
    description: 'Create and send marketing campaigns to customers',
    category: 'MARKETING',
    dependencies: ['clients.list'],
    discoverability: 'PROMOTED',
    recommendWhen: {
      conditions: [
        { type: 'client_count', operator: 'gte', value: 100 },
        { type: 'repeat_rate', operator: 'lt', value: 0.4 }
      ]
    },
    helpUrl: '/help/email-marketing',
  },

  // Advanced Features
  {
    key: 'advanced.api-access',
    name: 'API Access',
    description: 'Integrate WorkStream with custom applications and tools',
    category: 'DEVELOPER_TOOLS',
    requiresPlan: 'PREMIUM',
    discoverability: 'HIDDEN',
    recommendWhen: {
      conditions: [
        { type: 'custom_integrations', operator: 'requested', value: true },
        { type: 'technical_team', operator: 'exists', value: true }
      ]
    },
    helpUrl: '/help/api-access',
  },
  {
    key: 'advanced.custom-fields',
    name: 'Custom Fields',
    description: 'Add custom data fields to leads, clients, and jobs',
    category: 'AUTOMATION',
    dependencies: ['leads.list', 'clients.list'],
    discoverability: 'STANDARD',
    recommendWhen: {
      conditions: [
        { type: 'data_complexity', operator: 'high', value: true },
        { type: 'industry_specific', operator: 'exists', value: true }
      ]
    },
    helpUrl: '/help/custom-fields',
  },
];

async function seedFeatureRegistry() {
  console.log('Seeding feature registry...');
  
  // TODO: Fix FeatureCategory enum usage - temporarily disabled for deployment
  console.log('⚠️  Feature registry seeding temporarily disabled due to TypeScript enum issues');
  console.log('   This will be fixed after deployment to resolve security issue');

  /* TEMPORARILY DISABLED - NEEDS ENUM FIXES
  for (const featureData of features) {
    await prisma.featureRegistry.upsert({
      where: { key: featureData.key },
      create: featureData,
      update: {
        name: featureData.name,
        description: featureData.description,
        category: featureData.category,
        defaultEnabled: featureData.defaultEnabled,
        requiresPlan: featureData.requiresPlan,
        dependencies: featureData.dependencies || [],
        incompatible: featureData.incompatible || [],
        discoverability: featureData.discoverability,
        recommendWhen: featureData.recommendWhen,
        helpUrl: featureData.helpUrl,
        updatedAt: new Date(),
      },
    });
  }
  */
  
  console.log(`Seeded ${features.length} features successfully!`);
}

export { seedFeatureRegistry };

// Run if called directly
if (require.main === module) {
  seedFeatureRegistry()
    .catch((e) => {
      console.error('Error seeding feature registry:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}