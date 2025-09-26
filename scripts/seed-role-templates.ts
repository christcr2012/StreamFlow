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
  },

  // === MANAGEMENT & SUPERVISION ===
  {
    name: "Supervisor",
    description: "Oversee teams and jobs with limited admin within assigned scope. Team oversight, task assignment, and scoped visibility.",
    industry: "Management",
    category: "Team Supervision",
    complexity: "INTERMEDIATE",
    permissions: [
      "team:assign_tasks", "team:reassign_tasks", "team:manage_schedule", "team:modify_schedule",
      "team:approve_timesheet", "team:approve_worklog", "team:approve_completion",
      "team:coordinate", "team:adjust_priorities",
      "dashboard:team_performance", "customer:read_scoped", "job:read_scoped", 
      "project:monitor_status", "location:access_data", "metrics:team_assigned",
      "escalation:request_elevation", "escalation:to_management", "escalation:emergency_assign",
      "communication:team_messaging", "communication:customer_scoped", "communication:status_updates",
      "quality:review_work", "quality:validate_checklist", "quality:identify_issues",
      "admin:guide_team", "admin:clarify_procedures", "admin:allocate_resources_scoped",
      "profile:read", "profile:update", "notifications:manage"
    ],
    config: {
      defaultDashboard: "supervisor",
      allowedModules: ["team_management", "scheduling", "quality_control", "performance_monitoring"],
      restrictedAreas: ["tenant_settings", "billing", "role_management", "global_configurations"],
      scopedAccess: true,
      auditLogging: true,
      temporaryElevation: true
    },
    scopeConfig: {
      teamBased: true,
      locationBased: true,
      projectBased: true,
      timeRestricted: true,
      approvalLimits: {
        expenses: 500,
        adjustments: 200
      },
      escalationRules: {
        canRequestElevation: true,
        maxElevationDuration: 60
      }
    },
    isSystemTemplate: true,
    isPublic: true
  },

  {
    name: "Manager",
    description: "Run day-to-day operations across departments. Capacity planning, staff management, and operational KPIs with department scoping.",
    industry: "Management", 
    category: "Operations Management",
    complexity: "ADVANCED",
    permissions: [
      "operations:plan_capacity", "operations:create_schedule", "operations:optimize_schedule",
      "operations:manage_inventory", "operations:manage_assets", "operations:handle_escalations",
      "operations:process_refunds", "operations:issue_credits", "operations:allocate_resources",
      "people:review_timesheets", "people:approve_timesheets", "people:review_expenses",
      "people:approve_expenses", "people:monitor_performance", "people:coordinate_staff",
      "analytics:view_kpis", "analytics:department_metrics", "analytics:financial_performance",
      "analytics:productivity", "analytics:create_reports", "analytics:export_data",
      "customer:resolve_escalations", "customer:monitor_service_levels", "customer:review_feedback",
      "finance:monitor_budget", "finance:oversee_expenses", "finance:manage_cost_center",
      "quality:oversee_assurance", "quality:monitor_compliance", "quality:improve_processes",
      "communication:cross_department", "communication:stakeholders", "communication:leadership_reporting",
      "profile:read", "profile:update", "notifications:manage"
    ],
    config: {
      defaultDashboard: "operations_manager",
      allowedModules: ["operations", "people_management", "analytics", "customer_service", "financial_oversight", "quality_management"],
      restrictedAreas: ["user_role_administration", "global_configurations", "provider_portal", "system_admin"],
      departmentScoped: true,
      auditLogging: true,
      budgetManagement: true
    },
    scopeConfig: {
      departmentBased: true,
      locationBased: true,
      costCenterBased: true,
      budgetLimits: {
        daily: 5000,
        weekly: 25000,
        monthly: 100000
      },
      approvalLimits: {
        refunds: 2500,
        expenses: 5000,
        purchases: 10000
      },
      timeRestrictions: {
        businessHoursOnly: false,
        extendedAccess: true
      }
    },
    isSystemTemplate: true,
    isPublic: true
  },

  // === PLATFORM PROVIDER ===
  {
    name: "Provider",
    description: "System/service provider role for cross-tenant platform management, service delivery, and compliance enforcement without access to tenant business operations.",
    industry: "Platform Administration",
    category: "System Provider",
    complexity: "ADVANCED",
    permissions: [
      // Service Management
      "system:enable_feature_flags", "system:disable_feature_flags", "system:configure_industry_templates",
      "system:deploy_tenant_templates", "system:manage_ai_automation_limits", "system:configure_module_availability",
      "system:update_service_catalog",
      
      // System Monitoring  
      "analytics:view_tenant_aggregated", "analytics:resource_consumption_all", "analytics:performance_metrics_system",
      "analytics:compliance_risk_assessment", "analytics:usage_patterns_anonymized", "monitoring:system_health_dashboard",
      "monitoring:error_tracking_cross_tenant",
      
      // Support Tools
      "support:initiate_impersonation", "support:generate_diagnostic_reports", "support:create_secure_support_session",
      "support:access_system_logs", "support:trigger_health_checks", "support:emergency_system_access",
      
      // Compliance & Security
      "security:enforce_baseline_policies", "security:manage_mfa_requirements", "security:configure_encryption_standards",
      "compliance:manage_audit_retention", "compliance:configure_data_residency", "compliance:push_security_patches",
      "compliance:force_system_updates", "compliance:generate_compliance_reports",
      
      // Integration Controls
      "integrations:curate_available_connectors", "integrations:enforce_sla_compliance", 
      "integrations:security_review_integrations", "integrations:manage_api_gateway", "integrations:update_connector_catalog",
      
      // Platform Administration
      "platform:configure_system_settings", "platform:manage_global_configurations", "platform:deploy_infrastructure_updates",
      "platform:manage_provider_portal", "platform:configure_tenant_provisioning",
      
      // Audit & Transparency
      "audit:access_immutable_logs", "audit:generate_system_reports", "audit:notify_tenants_of_changes",
      "audit:manage_transparency_dashboard",
      
      "profile:read", "profile:update", "notifications:manage"
    ],
    config: {
      defaultDashboard: "provider_system_overview",
      allowedModules: ["system_administration", "tenant_analytics", "service_management", "compliance_monitoring", "support_tools", "integration_management", "platform_configuration"],
      restrictedAreas: ["tenant_business_operations", "tenant_customer_data", "tenant_financial_records", "tenant_staff_management", "tenant_operational_data"],
      systemLevelAccess: true,
      crossTenantVisibility: true,
      immutableAuditLogging: true,
      tenantNotificationRequired: true,
      dataIsolationEnforcement: true
    },
    scopeConfig: {
      systemWide: true,
      crossTenant: true,
      serviceDeliveryFocused: true,
      businessDataRestricted: true,
      impersonationRules: {
        requiresTenantConsent: true,
        maxSessionDuration: 120,
        autoTermination: true,
        fullAuditLogging: true,
        ownerApprovalRequired: true
      },
      dataSafeguards: {
        noBusinessRecords: true,
        noCustomerData: true,
        noFinancialRecords: true,
        noOperationalData: true,
        aggregatedAnalyticsOnly: true,
        anonymizationRequired: true
      },
      complianceRequirements: {
        soc2Aligned: true,
        iso27001Aligned: true,
        gdprCompliant: true,
        auditRetention: "7_years",
        dataResidencyRespect: true
      },
      transparencyControls: {
        tenantChangeNotification: true,
        actionVisibilityToTenants: true,
        changeLogMaintenance: true,
        consentAuditTrail: true
      }
    },
    isSystemTemplate: true,
    isPublic: false,
    isProviderExclusive: true
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