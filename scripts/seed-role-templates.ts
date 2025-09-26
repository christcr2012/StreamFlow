// scripts/seed-role-templates.ts
import { prisma as db } from "../src/lib/prisma";

interface RoleTemplateData {
  name: string;
  description: string;
  industry: string;
  category: string;
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  permissions: string[];
  config: Record<string, any>;
  scopeConfig: Record<string, any>;
  isSystemTemplate: boolean;
  isPublic: boolean;
}

const industryTemplates: RoleTemplateData[] = [
  // === CLEANING & JANITORIAL SERVICES ===
  {
    name: "Operations Manager",
    description: "Manages daily cleaning operations, staff scheduling, and client relationships for janitorial services",
    industry: "Cleaning & Janitorial",
    category: "Management",
    complexity: "ADVANCED",
    permissions: [
      "lead:read", "lead:create", "lead:update", "lead:delete",
      "customer:read", "customer:create", "customer:update",
      "job:read", "job:create", "job:update", "job:assign",
      "user:read", "user:invite", "schedule:manage",
      "invoice:read", "invoice:create", "payment:read",
      "report:financial", "report:operational", "audit:read"
    ],
    config: {
      defaultDashboard: "operations",
      allowedModules: ["leads", "customers", "jobs", "scheduling", "billing", "reports"],
      restrictedAreas: ["system_admin", "org_settings"]
    },
    scopeConfig: {
      geographic: true,
      timeRestricted: false,
      projectBased: true
    },
    isSystemTemplate: true,
    isPublic: true
  },

  {
    name: "Site Supervisor",
    description: "Supervises cleaning operations at specific client sites and manages on-site staff",
    industry: "Cleaning & Janitorial",
    category: "Operations",
    complexity: "INTERMEDIATE",
    permissions: [
      "job:read", "job:update", "job:complete",
      "customer:read", "schedule:view", "schedule:update",
      "timesheet:create", "timesheet:read", "timesheet:submit",
      "checklist:complete", "issue:report", "issue:track",
      "media:upload", "training:view", "training:complete"
    ],
    config: {
      defaultDashboard: "site_operations",
      allowedModules: ["jobs", "scheduling", "timesheets", "checklists", "issues"],
      mobileOptimized: true
    },
    scopeConfig: {
      geographic: true,
      timeRestricted: true,
      projectBased: true,
      siteSpecific: true
    },
    isSystemTemplate: true,
    isPublic: true
  },

  {
    name: "Cleaning Technician",
    description: "Performs cleaning tasks, completes checklists, and reports issues at assigned sites",
    industry: "Cleaning & Janitorial",
    category: "Field Operations",
    complexity: "BASIC",
    permissions: [
      "job:read", "job:update", "schedule:view",
      "timesheet:create", "timesheet:read",
      "checklist:complete", "issue:report",
      "media:upload", "training:view"
    ],
    config: {
      defaultDashboard: "technician",
      allowedModules: ["jobs", "timesheets", "checklists"],
      mobileOptimized: true,
      readOnlyMode: true
    },
    scopeConfig: {
      geographic: true,
      timeRestricted: true,
      taskSpecific: true
    },
    isSystemTemplate: true,
    isPublic: true
  },

  // === HEALTHCARE SERVICES ===
  {
    name: "Healthcare Administrator",
    description: "Manages healthcare facility operations, staff, and patient service coordination",
    industry: "Healthcare",
    category: "Administration",
    complexity: "ADVANCED",
    permissions: [
      "patient:read", "patient:create", "patient:update",
      "staff:read", "staff:manage", "schedule:manage",
      "appointment:read", "appointment:create", "appointment:reschedule",
      "billing:read", "billing:process", "insurance:verify",
      "report:clinical", "report:financial", "compliance:audit"
    ],
    config: {
      defaultDashboard: "healthcare_admin",
      allowedModules: ["patients", "staff", "scheduling", "billing", "compliance"],
      hipaaCompliant: true
    },
    scopeConfig: {
      departmentBased: true,
      timeRestricted: false,
      patientDataAccess: "full"
    },
    isSystemTemplate: true,
    isPublic: true
  },

  {
    name: "Nurse Practitioner",
    description: "Provides patient care, manages treatment plans, and coordinates with medical staff",
    industry: "Healthcare",
    category: "Clinical",
    complexity: "INTERMEDIATE",
    permissions: [
      "patient:read", "patient:update", "patient:treat",
      "medical_record:read", "medical_record:create", "medical_record:update",
      "prescription:create", "prescription:modify",
      "appointment:read", "appointment:reschedule",
      "lab:order", "lab:review", "consultation:request"
    ],
    config: {
      defaultDashboard: "clinical",
      allowedModules: ["patients", "medical_records", "prescriptions", "lab_results"],
      clinicalAccess: true
    },
    scopeConfig: {
      departmentBased: true,
      timeRestricted: true,
      patientDataAccess: "assigned"
    },
    isSystemTemplate: true,
    isPublic: true
  },

  // === PROFESSIONAL SERVICES ===
  {
    name: "Account Manager",
    description: "Manages client accounts, oversees project delivery, and drives business growth",
    industry: "Professional Services",
    category: "Client Management",
    complexity: "INTERMEDIATE",
    permissions: [
      "client:read", "client:create", "client:update",
      "project:read", "project:create", "project:manage",
      "contract:read", "contract:negotiate", "contract:approve",
      "invoice:read", "invoice:create", "payment:track",
      "proposal:create", "proposal:send", "meeting:schedule"
    ],
    config: {
      defaultDashboard: "account_management",
      allowedModules: ["clients", "projects", "contracts", "billing", "proposals"],
      salesAccess: true
    },
    scopeConfig: {
      clientBased: true,
      projectBased: true,
      revenueThreshold: 100000
    },
    isSystemTemplate: true,
    isPublic: true
  },

  {
    name: "Project Coordinator",
    description: "Coordinates project activities, manages timelines, and facilitates team communication",
    industry: "Professional Services",
    category: "Project Management",
    complexity: "INTERMEDIATE",
    permissions: [
      "project:read", "project:update", "project:track",
      "task:create", "task:assign", "task:monitor",
      "resource:allocate", "timeline:manage",
      "meeting:schedule", "meeting:facilitate",
      "document:create", "document:share", "report:project"
    ],
    config: {
      defaultDashboard: "project_coordination",
      allowedModules: ["projects", "tasks", "resources", "documents", "reports"],
      collaborationTools: true
    },
    scopeConfig: {
      projectBased: true,
      teamBased: true,
      timeRestricted: false
    },
    isSystemTemplate: true,
    isPublic: true
  },

  // === MANUFACTURING ===
  {
    name: "Production Manager",
    description: "Oversees manufacturing operations, quality control, and production scheduling",
    industry: "Manufacturing",
    category: "Operations",
    complexity: "ADVANCED",
    permissions: [
      "production:read", "production:schedule", "production:monitor",
      "inventory:read", "inventory:manage", "inventory:order",
      "quality:inspect", "quality:approve", "quality:reject",
      "equipment:read", "equipment:maintain", "equipment:schedule",
      "staff:schedule", "safety:monitor", "report:production"
    ],
    config: {
      defaultDashboard: "production",
      allowedModules: ["production", "inventory", "quality", "equipment", "safety"],
      realTimeMonitoring: true
    },
    scopeConfig: {
      plantBased: true,
      shiftBased: true,
      productionLine: true
    },
    isSystemTemplate: true,
    isPublic: true
  },

  {
    name: "Quality Inspector",
    description: "Performs quality inspections, maintains compliance standards, and reports quality issues",
    industry: "Manufacturing",
    category: "Quality Control",
    complexity: "BASIC",
    permissions: [
      "quality:inspect", "quality:document", "quality:report",
      "product:test", "product:approve", "product:reject",
      "compliance:check", "audit:participate",
      "equipment:calibrate", "standard:follow"
    ],
    config: {
      defaultDashboard: "quality_control",
      allowedModules: ["quality", "compliance", "testing", "documentation"],
      mobileOptimized: true
    },
    scopeConfig: {
      plantBased: true,
      shiftBased: true,
      productionLine: true,
      inspectionLevel: "standard"
    },
    isSystemTemplate: true,
    isPublic: true
  },

  // === TECHNOLOGY/SOFTWARE ===
  {
    name: "Engineering Manager",
    description: "Leads engineering teams, manages technical projects, and oversees software development",
    industry: "Technology",
    category: "Engineering Leadership",
    complexity: "ADVANCED",
    permissions: [
      "code:read", "code:review", "code:approve",
      "project:create", "project:manage", "project:deploy",
      "team:manage", "team:hire", "team:performance",
      "architecture:design", "architecture:approve",
      "system:monitor", "incident:manage", "security:review"
    ],
    config: {
      defaultDashboard: "engineering",
      allowedModules: ["projects", "teams", "code", "systems", "security"],
      technicalAccess: true
    },
    scopeConfig: {
      teamBased: true,
      projectBased: true,
      systemAccess: "full"
    },
    isSystemTemplate: true,
    isPublic: true
  },

  {
    name: "DevOps Engineer",
    description: "Manages infrastructure, deployment pipelines, and system reliability",
    industry: "Technology",
    category: "Infrastructure",
    complexity: "INTERMEDIATE",
    permissions: [
      "infrastructure:read", "infrastructure:deploy", "infrastructure:configure",
      "pipeline:create", "pipeline:manage", "pipeline:monitor",
      "system:monitor", "system:debug", "system:scale",
      "security:scan", "security:patch", "backup:manage",
      "incident:respond", "log:analyze"
    ],
    config: {
      defaultDashboard: "devops",
      allowedModules: ["infrastructure", "pipelines", "monitoring", "security", "incidents"],
      systemAccess: true
    },
    scopeConfig: {
      environmentBased: true,
      systemAccess: "infrastructure",
      emergencyAccess: true
    },
    isSystemTemplate: true,
    isPublic: true
  },

  // === FINANCE & ACCOUNTING ===
  {
    name: "Accountant",
    description: "Finance professional with access to accounting, reporting, and compliance functions. Secure and compliant financial operations.",
    industry: "Finance",
    category: "Accounting",
    complexity: "INTERMEDIATE",
    permissions: [
      "accounting:ledger:read", "accounting:ledger:create",
      "accounting:ap:read", "accounting:ap:create", "accounting:ap:process",
      "accounting:ar:read", "accounting:ar:create", "accounting:ar:collect",
      "accounting:invoice:read", "accounting:invoice:create", "accounting:invoice:send",
      "accounting:expense:read", "accounting:expense:create",
      "reports:financial:view", "reports:financial:export", "reports:custom:create",
      "tax:data:read", "tax:data:create", "tax:payments:process", "tax:filings:prepare",
      "banking:accounts:view", "banking:reconcile", "banking:transactions:import",
      "integration:accounting:setup", "integration:data:sync",
      "compliance:audit_trail:view", "compliance:reports:generate",
      "profile:read", "profile:update", "notifications:manage"
    ],
    config: {
      defaultDashboard: "accounting",
      allowedModules: ["accounting", "financial_reporting", "tax_management", "banking", "compliance"],
      restrictedAreas: ["business_operations", "user_management", "system_admin"],
      financialDataOnly: true,
      auditLogging: true,
      complianceLevel: "high"
    },
    scopeConfig: {
      tenantIsolation: true,
      financialModulesOnly: true,
      approvalRequired: ["major_adjustments", "sensitive_reports"],
      exportLogging: true
    },
    isSystemTemplate: true,
    isPublic: true
  }
];

async function seedRoleTemplates() {
  console.log("🌱 Seeding industry role templates...");

  try {
    // Clear existing system templates
    await db.roleTemplate.deleteMany({
      where: { isSystemTemplate: true }
    });

    // Create new templates
    const created = await Promise.all(
      industryTemplates.map((template: RoleTemplateData) => 
        db.roleTemplate.create({
          data: {
            ...template,
            usageCount: 0,
            createdBy: 'system'
          }
        })
      )
    );

    console.log(`✅ Successfully created ${created.length} industry role templates:`);
    
    // Group by industry for reporting
    const byIndustry = created.reduce((acc: Record<string, string[]>, template: any) => {
      if (!acc[template.industry]) acc[template.industry] = [];
      acc[template.industry].push(template.name);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(byIndustry).forEach(([industry, roles]: [string, string[]]) => {
      console.log(`  📁 ${industry}: ${roles.join(', ')}`);
    });

    console.log("🎉 Role template seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding role templates:", error);
    throw error;
  }
}

if (require.main === module) {
  seedRoleTemplates()
    .then(() => {
      console.log("✨ Seeding process finished!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedRoleTemplates, industryTemplates };