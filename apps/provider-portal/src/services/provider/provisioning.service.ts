/**
 * Tenant Provisioning Service
 *
 * Handles automated tenant provisioning workflows, templates, and resource allocation
 */

import { prisma } from '@/lib/prisma';
import { safeQuery } from '@/lib/utils/query.utils';

// Types
export type WorkflowStep = {
  id: string;
  name: string;
  type: 'create_database' | 'allocate_resources' | 'send_notification' | 'create_user' | 'assign_plan' | 'custom';
  config: Record<string, any>;
  order: number;
  requiresApproval: boolean;
  approvalRole?: string;
};

export type ProvisioningTemplate = {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  defaultPlan?: string;
  defaultResources?: {
    cpu: number;
    memory: number;
    storage: number;
  };
  notificationTriggers: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ProvisioningWorkflow = {
  id: string;
  tenantId: string;
  tenantName: string;
  templateId: string;
  templateName: string;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  approvals: {
    stepId: string;
    approvedBy?: string;
    approvedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
  }[];
};

/**
 * Get all provisioning templates
 */
export async function getProvisioningTemplates(): Promise<ProvisioningTemplate[]> {
  // Mock data - in production, this would come from database
  return [
    {
      id: 'tpl_starter',
      name: 'Starter Plan',
      description: 'Basic tenant setup with minimal resources',
      steps: [
        {
          id: 'step_1',
          name: 'Create Database',
          type: 'create_database',
          config: { size: 'small' },
          order: 1,
          requiresApproval: false,
        },
        {
          id: 'step_2',
          name: 'Allocate Resources',
          type: 'allocate_resources',
          config: { cpu: 1, memory: 2048, storage: 10240 },
          order: 2,
          requiresApproval: false,
        },
        {
          id: 'step_3',
          name: 'Create Admin User',
          type: 'create_user',
          config: { role: 'admin' },
          order: 3,
          requiresApproval: false,
        },
        {
          id: 'step_4',
          name: 'Send Welcome Email',
          type: 'send_notification',
          config: { template: 'welcome_email' },
          order: 4,
          requiresApproval: false,
        },
      ],
      defaultPlan: 'starter',
      defaultResources: { cpu: 1, memory: 2048, storage: 10240 },
      notificationTriggers: ['workflow_started', 'workflow_completed'],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: 'tpl_professional',
      name: 'Professional Plan',
      description: 'Enhanced setup with additional resources and features',
      steps: [
        {
          id: 'step_1',
          name: 'Create Database',
          type: 'create_database',
          config: { size: 'medium' },
          order: 1,
          requiresApproval: false,
        },
        {
          id: 'step_2',
          name: 'Allocate Resources',
          type: 'allocate_resources',
          config: { cpu: 2, memory: 4096, storage: 51200 },
          order: 2,
          requiresApproval: true,
          approvalRole: 'admin',
        },
        {
          id: 'step_3',
          name: 'Create Admin User',
          type: 'create_user',
          config: { role: 'admin' },
          order: 3,
          requiresApproval: false,
        },
        {
          id: 'step_4',
          name: 'Assign Professional Plan',
          type: 'assign_plan',
          config: { plan: 'professional' },
          order: 4,
          requiresApproval: false,
        },
        {
          id: 'step_5',
          name: 'Send Welcome Email',
          type: 'send_notification',
          config: { template: 'welcome_email_pro' },
          order: 5,
          requiresApproval: false,
        },
      ],
      defaultPlan: 'professional',
      defaultResources: { cpu: 2, memory: 4096, storage: 51200 },
      notificationTriggers: ['workflow_started', 'approval_required', 'workflow_completed'],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: 'tpl_enterprise',
      name: 'Enterprise Plan',
      description: 'Full-featured setup with dedicated resources',
      steps: [
        {
          id: 'step_1',
          name: 'Create Dedicated Database',
          type: 'create_database',
          config: { size: 'large', dedicated: true },
          order: 1,
          requiresApproval: true,
          approvalRole: 'admin',
        },
        {
          id: 'step_2',
          name: 'Allocate Dedicated Resources',
          type: 'allocate_resources',
          config: { cpu: 4, memory: 8192, storage: 102400 },
          order: 2,
          requiresApproval: true,
          approvalRole: 'admin',
        },
        {
          id: 'step_3',
          name: 'Create Admin User',
          type: 'create_user',
          config: { role: 'admin' },
          order: 3,
          requiresApproval: false,
        },
        {
          id: 'step_4',
          name: 'Assign Enterprise Plan',
          type: 'assign_plan',
          config: { plan: 'enterprise' },
          order: 4,
          requiresApproval: false,
        },
        {
          id: 'step_5',
          name: 'Send Welcome Email',
          type: 'send_notification',
          config: { template: 'welcome_email_enterprise' },
          order: 5,
          requiresApproval: false,
        },
        {
          id: 'step_6',
          name: 'Schedule Onboarding Call',
          type: 'custom',
          config: { action: 'schedule_call' },
          order: 6,
          requiresApproval: false,
        },
      ],
      defaultPlan: 'enterprise',
      defaultResources: { cpu: 4, memory: 8192, storage: 102400 },
      notificationTriggers: ['workflow_started', 'approval_required', 'workflow_completed', 'step_failed'],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  ];
}

/**
 * Get active provisioning workflows
 */
export async function getActiveWorkflows(): Promise<ProvisioningWorkflow[]> {
  // Get recent customers as mock workflows
  const customers = await safeQuery(
    () => prisma.customer.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        company: true,
        primaryName: true,
        createdAt: true,
      },
    }),
    [],
    'Failed to fetch active provisioning workflows'
  );

  return customers.map((customer: any, idx: number) => {
    const templates = ['tpl_starter', 'tpl_professional', 'tpl_enterprise'];
    const statuses: ProvisioningWorkflow['status'][] = ['completed', 'in_progress', 'awaiting_approval', 'pending', 'failed'];
    const templateId = templates[idx % templates.length];
    const status = statuses[idx % statuses.length];
    
    const totalSteps = templateId === 'tpl_starter' ? 4 : templateId === 'tpl_professional' ? 5 : 6;
    const currentStep = status === 'completed' ? totalSteps : 
                       status === 'failed' ? Math.floor(totalSteps / 2) :
                       status === 'in_progress' ? Math.floor(totalSteps / 2) :
                       status === 'awaiting_approval' ? 2 : 0;

    return {
      id: `wf_${customer.id}`,
      tenantId: customer.id,
      tenantName: customer.company || customer.primaryName || 'Unknown',
      templateId,
      templateName: templateId === 'tpl_starter' ? 'Starter Plan' :
                   templateId === 'tpl_professional' ? 'Professional Plan' : 'Enterprise Plan',
      status,
      currentStep,
      totalSteps,
      startedAt: customer.createdAt,
      completedAt: status === 'completed' ? new Date(customer.createdAt.getTime() + 3600000) : undefined,
      error: status === 'failed' ? 'Database creation failed: Connection timeout' : undefined,
      approvals: status === 'awaiting_approval' ? [
        {
          stepId: 'step_2',
          status: 'pending',
        },
      ] : [],
    };
  });
}

/**
 * Get workflow statistics
 */
export async function getWorkflowStats() {
  const workflows = await getActiveWorkflows();
  
  const total = workflows.length;
  const completed = workflows.filter(w => w.status === 'completed').length;
  const inProgress = workflows.filter(w => w.status === 'in_progress').length;
  const awaitingApproval = workflows.filter(w => w.status === 'awaiting_approval').length;
  const failed = workflows.filter(w => w.status === 'failed').length;
  
  const avgCompletionTime = workflows
    .filter(w => w.status === 'completed' && w.completedAt)
    .reduce((sum: any, w: any) => sum + (w.completedAt!.getTime() - w.startedAt.getTime()), 0) / (completed || 1);

  return {
    total,
    completed,
    inProgress,
    awaitingApproval,
    failed,
    successRate: total > 0 ? (completed / total) * 100 : 0,
    avgCompletionTimeMinutes: Math.round(avgCompletionTime / 60000),
  };
}

/**
 * Create a new provisioning workflow
 */
export async function createWorkflow(templateId: string, tenantId: string): Promise<ProvisioningWorkflow> {
  const templates = await getProvisioningTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error('Template not found');
  }

  const customer = await safeQuery(
    () => prisma.customer.findUnique({
      where: { id: tenantId },
      select: { company: true, primaryName: true },
    }),
    null,
    `Failed to fetch tenant ${tenantId} for provisioning`
  );

  if (!customer) {
    throw new Error('Tenant not found');
  }

  // In production, this would create a workflow record in the database
  return {
    id: `wf_${Date.now()}`,
    tenantId,
    tenantName: customer.company || customer.primaryName || 'Unknown',
    templateId: template.id,
    templateName: template.name,
    status: 'pending',
    currentStep: 0,
    totalSteps: template.steps.length,
    startedAt: new Date(),
    approvals: template.steps
      .filter(step => step.requiresApproval)
      .map(step => ({
        stepId: step.id,
        status: 'pending' as const,
      })),
  };
}

