// prisma/industry-seed.ts
// Multi-Industry Verticalization Framework Seed Data
// Based on proDBx research and service industry best practices

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Core Capabilities that can be enabled across industries
const CORE_CAPABILITIES = [
  // Operations & Field Management
  {
    code: "lead_management",
    displayName: "Lead Management",
    description: "Capture, score, and track leads through the sales pipeline",
    category: "sales",
    isCore: true,
    requiresSubscription: false,
    apiEndpoints: ["/api/leads/*"],
    uiComponents: ["LeadDashboard", "LeadForm", "LeadList"],
    permissions: ["lead:read", "lead:create", "lead:update"]
  },
  {
    code: "estimation_bidding",
    displayName: "Estimation & Bidding",
    description: "Create professional estimates and convert to contracts",
    category: "sales",
    isCore: false,
    requiresSubscription: true,
    minimumPlan: "PROFESSIONAL",
    apiEndpoints: ["/api/estimates/*", "/api/bids/*"],
    uiComponents: ["EstimateBuilder", "BidTracker", "PriceCalculator"],
    permissions: ["estimate:create", "estimate:update", "bid:manage"]
  },
  {
    code: "contract_management",
    displayName: "Contract Management",
    description: "Digital contracts with e-signatures and automated workflows",
    category: "sales",
    isCore: false,
    requiresSubscription: true,
    minimumPlan: "PROFESSIONAL",
    dependencies: ["estimation_bidding"],
    apiEndpoints: ["/api/contracts/*"],
    uiComponents: ["ContractBuilder", "ESignature", "ContractLibrary"],
    permissions: ["contract:create", "contract:sign", "contract:manage"]
  },
  {
    code: "work_order_management",
    displayName: "Work Order Management",
    description: "Create and track work orders with dynamic checklists",
    category: "operations",
    isCore: true,
    requiresSubscription: false,
    apiEndpoints: ["/api/work-orders/*"],
    uiComponents: ["WorkOrderList", "WorkOrderForm", "ChecklistBuilder"],
    permissions: ["workorder:read", "workorder:create", "workorder:update"]
  },
  {
    code: "inventory_management",
    displayName: "Multi-Location Inventory",
    description: "Track inventory across warehouses, vehicles, and job sites",
    category: "operations",
    isCore: false,
    requiresSubscription: true,
    minimumPlan: "PROFESSIONAL",
    apiEndpoints: ["/api/inventory/*", "/api/stock-locations/*"],
    uiComponents: ["InventoryDashboard", "StockTracker", "LocationManager"],
    permissions: ["inventory:read", "inventory:update", "stock:transfer"]
  },
  {
    code: "mobile_field_app",
    displayName: "Mobile Field Operations",
    description: "Mobile app for field crews with QR scanning and offline mode",
    category: "operations",
    isCore: false,
    requiresSubscription: true,
    minimumPlan: "PROFESSIONAL",
    dependencies: ["work_order_management"],
    apiEndpoints: ["/api/mobile/*"],
    uiComponents: ["MobileApp", "QRScanner", "OfflineSync"],
    permissions: ["mobile:access", "checklist:complete", "media:upload"]
  },
  {
    code: "scheduling_dispatch",
    displayName: "Scheduling & Dispatch",
    description: "Schedule jobs, assign crews, and optimize routes",
    category: "operations",
    isCore: false,
    requiresSubscription: true,
    minimumPlan: "BASIC",
    dependencies: ["work_order_management"],
    apiEndpoints: ["/api/scheduling/*", "/api/dispatch/*"],
    uiComponents: ["Calendar", "DispatchBoard", "RouteOptimizer"],
    permissions: ["schedule:read", "schedule:manage", "dispatch:assign"]
  },
  {
    code: "automated_billing",
    displayName: "Automated Billing",
    description: "Conversion-based billing with Stripe integration",
    category: "billing",
    isCore: true,
    requiresSubscription: false,
    apiEndpoints: ["/api/billing/*", "/api/invoices/*"],
    uiComponents: ["BillingDashboard", "InvoiceManager", "PaymentTracker"],
    permissions: ["billing:read", "invoice:create", "payment:process"]
  },
  {
    code: "compliance_tracking",
    displayName: "Compliance & Permits",
    description: "Track industry-specific compliance and permit requirements",
    category: "compliance",
    isCore: false,
    requiresSubscription: true,
    minimumPlan: "PROFESSIONAL",
    apiEndpoints: ["/api/compliance/*", "/api/permits/*"],
    uiComponents: ["ComplianceDashboard", "PermitTracker", "AuditLog"],
    permissions: ["compliance:read", "permit:manage", "audit:view"]
  }
];

// Industry-Specific Packs
const INDUSTRY_PACKS = [
  {
    industryCode: "cleaning",
    displayName: "Professional Cleaning Services",
    description: "Complete business management for cleaning companies - janitorial, residential, commercial",
    naicsRanges: ["561720", "562910", "561740"], // Janitorial Services, Carpet Cleaning, Document Preparation
    sicRanges: ["7342", "7349", "7381"], // Disinfecting Services, Building Cleaning, Detective/Security
    
    leadFields: {
      propertyType: { type: "select", options: ["office", "retail", "medical", "residential", "industrial"], required: true },
      squareFootage: { type: "number", min: 100, max: 1000000, required: true },
      frequency: { type: "select", options: ["daily", "weekly", "biweekly", "monthly", "one-time"], required: true },
      serviceTypes: { type: "multiselect", options: ["general_cleaning", "carpet", "window", "floor_care", "disinfection"] },
      currentProvider: { type: "text", required: false },
      specialRequirements: { type: "textarea", required: false }
    },
    
    workflowSteps: [
      { id: "site_assessment", name: "Site Assessment", duration: 30, required: true },
      { id: "cleaning_execution", name: "Cleaning Execution", duration: 120, required: true },
      { id: "quality_check", name: "Quality Inspection", duration: 15, required: true },
      { id: "client_walkthrough", name: "Client Walkthrough", duration: 10, required: false }
    ],
    
    catalogItems: [
      { category: "supplies", name: "All-Purpose Cleaner", unit: "bottle", cost: 4.50 },
      { category: "supplies", name: "Microfiber Cloths", unit: "pack", cost: 12.00 },
      { category: "equipment", name: "Vacuum Cleaner", unit: "hour", cost: 8.00 },
      { category: "labor", name: "General Cleaning", unit: "hour", cost: 25.00 },
      { category: "labor", name: "Specialized Cleaning", unit: "hour", cost: 35.00 }
    ],
    
    rateCards: [
      { type: "labor", category: "general", rate: 25.00, unit: "hour" },
      { type: "labor", category: "specialized", rate: 35.00, unit: "hour" },
      { type: "labor", category: "supervisor", rate: 40.00, unit: "hour" },
      { type: "equipment", category: "standard", rate: 0.10, unit: "sqft" },
      { type: "supplies", category: "consumable", rate: 0.05, unit: "sqft" }
    ],
    
    formulaSet: {
      basic_cleaning: "Math.max(100, (squareFootage * 0.15) + (rooms * 25))",
      deep_cleaning: "Math.max(150, (squareFootage * 0.25) + (rooms * 40))",
      carpet_cleaning: "(squareFootage * 0.35) + (rooms * 15)"
    },
    
    measurementUnits: [
      { code: "sqft", name: "Square Feet", category: "area" },
      { code: "rooms", name: "Rooms", category: "count" },
      { code: "floors", name: "Floors", category: "count" }
    ],
    
    contractTemplates: [
      {
        name: "Standard Cleaning Contract",
        clauses: ["service_schedule", "payment_terms", "cancellation_policy", "insurance_requirements"]
      }
    ],
    
    requiredCapabilities: ["lead_management", "work_order_management", "automated_billing"],
    optionalCapabilities: ["estimation_bidding", "contract_management", "inventory_management", "mobile_field_app", "scheduling_dispatch"],
    hiddenCapabilities: []
  },
  
  {
    industryCode: "hvac",
    displayName: "HVAC Services",
    description: "Heating, ventilation, air conditioning installation, maintenance, and repair services",
    naicsRanges: ["238220", "811310", "423730"], // Plumbing/HVAC Contractors, Commercial Equipment Repair, Warm Air Equipment
    sicRanges: ["1711", "7623", "5075"], // Plumbing/Heating/AC, Refrigeration Repair, Warm Air Equipment
    
    leadFields: {
      serviceType: { type: "select", options: ["installation", "repair", "maintenance", "emergency"], required: true },
      equipmentType: { type: "multiselect", options: ["furnace", "ac_unit", "heat_pump", "ductwork", "thermostat"] },
      buildingType: { type: "select", options: ["residential", "commercial", "industrial"], required: true },
      squareFootage: { type: "number", min: 500, max: 100000 },
      equipmentAge: { type: "select", options: ["0-2_years", "3-5_years", "6-10_years", "10+_years"] },
      urgency: { type: "select", options: ["routine", "priority", "emergency"], required: true }
    },
    
    workflowSteps: [
      { id: "diagnostic_assessment", name: "System Diagnostic", duration: 60, required: true },
      { id: "parts_procurement", name: "Parts Procurement", duration: 240, required: false },
      { id: "installation_repair", name: "Installation/Repair", duration: 180, required: true },
      { id: "system_testing", name: "System Testing", duration: 30, required: true },
      { id: "customer_training", name: "Customer Training", duration: 15, required: false }
    ],
    
    catalogItems: [
      { category: "equipment", name: "Residential Furnace", unit: "unit", cost: 1200.00 },
      { category: "equipment", name: "AC Unit (3 ton)", unit: "unit", cost: 1800.00 },
      { category: "parts", name: "Air Filter", unit: "each", cost: 15.00 },
      { category: "labor", name: "HVAC Technician", unit: "hour", cost: 75.00 },
      { category: "labor", name: "Master Technician", unit: "hour", cost: 95.00 }
    ],
    
    rateCards: [
      { type: "labor", category: "apprentice", rate: 45.00, unit: "hour" },
      { type: "labor", category: "technician", rate: 75.00, unit: "hour" },
      { type: "labor", category: "master", rate: 95.00, unit: "hour" },
      { type: "equipment", category: "residential", rate: 50.00, unit: "ton" },
      { type: "equipment", category: "commercial", rate: 125.00, unit: "ton" }
    ],
    
    formulaSet: {
      repair_service: "75 + (laborHours * technicianRate) + partsCost + (mileage * 0.65)",
      installation: "(equipmentCost * 1.4) + (laborHours * technicianRate) + permitFees",
      maintenance_contract: "(squareFootage * 0.12) * frequency"
    },
    
    measurementUnits: [
      { code: "ton", name: "Tons (Cooling)", category: "capacity" },
      { code: "btu", name: "BTU", category: "capacity" },
      { code: "sqft", name: "Square Feet", category: "area" }
    ],
    
    requiredCapabilities: ["lead_management", "work_order_management", "scheduling_dispatch", "automated_billing"],
    optionalCapabilities: ["estimation_bidding", "contract_management", "inventory_management", "mobile_field_app", "compliance_tracking"],
    hiddenCapabilities: []
  },
  
  {
    industryCode: "fencing",
    displayName: "Fencing Contractors",
    description: "Fence installation, repair, and maintenance - residential and commercial",
    naicsRanges: ["238190", "321999", "444190"], // Other Foundation/Structure/Building Contractors, All Other Wood Products, Other Building Material Dealers
    sicRanges: ["1799", "2499", "5211"], // Special Trade Contractors, Wood Products, Lumber/Building Materials
    
    leadFields: {
      fenceType: { type: "select", options: ["wood", "vinyl", "aluminum", "chain_link", "iron", "composite"], required: true },
      projectType: { type: "select", options: ["new_installation", "repair", "replacement", "maintenance"], required: true },
      linearFeet: { type: "number", min: 10, max: 10000, required: true },
      height: { type: "select", options: ["3ft", "4ft", "5ft", "6ft", "8ft", "custom"], required: true },
      gateCount: { type: "number", min: 0, max: 20, default: 0 },
      terrain: { type: "select", options: ["flat", "slight_slope", "steep_slope", "rocky"], required: true },
      propertyType: { type: "select", options: ["residential", "commercial", "industrial", "agricultural"], required: true }
    },
    
    workflowSteps: [
      { id: "site_survey", name: "Site Survey & Measurement", duration: 45, required: true },
      { id: "permit_acquisition", name: "Permit Processing", duration: 480, required: false },
      { id: "material_delivery", name: "Material Delivery", duration: 120, required: true },
      { id: "fence_installation", name: "Fence Installation", duration: 360, required: true },
      { id: "cleanup_inspection", name: "Cleanup & Final Inspection", duration: 30, required: true }
    ],
    
    catalogItems: [
      { category: "materials", name: "Wood Privacy Panel (6ft)", unit: "panel", cost: 28.00 },
      { category: "materials", name: "Vinyl Privacy Panel (6ft)", unit: "panel", cost: 45.00 },
      { category: "materials", name: "Chain Link (6ft)", unit: "linear_foot", cost: 8.50 },
      { category: "hardware", name: "Gate Hardware Kit", unit: "kit", cost: 85.00 },
      { category: "labor", name: "Fence Installer", unit: "hour", cost: 45.00 }
    ],
    
    rateCards: [
      { type: "labor", category: "installer", rate: 45.00, unit: "hour" },
      { type: "labor", category: "crew_lead", rate: 55.00, unit: "hour" },
      { type: "materials", category: "wood", rate: 12.00, unit: "linear_foot" },
      { type: "materials", category: "vinyl", rate: 22.00, unit: "linear_foot" },
      { type: "materials", category: "chain_link", rate: 8.50, unit: "linear_foot" }
    ],
    
    formulaSet: {
      wood_fence: "(linearFeet * woodRate) + (gateCount * 350) + (laborHours * installerRate) + permitFees",
      vinyl_fence: "(linearFeet * vinylRate) + (gateCount * 450) + (laborHours * installerRate) + permitFees",
      chain_link: "(linearFeet * chainLinkRate) + (gateCount * 275) + (laborHours * installerRate)"
    },
    
    measurementUnits: [
      { code: "linear_foot", name: "Linear Feet", category: "length" },
      { code: "panel", name: "Panels", category: "count" },
      { code: "gate", name: "Gates", category: "count" }
    ],
    
    requiredCapabilities: ["lead_management", "estimation_bidding", "work_order_management", "automated_billing"],
    optionalCapabilities: ["contract_management", "inventory_management", "mobile_field_app", "scheduling_dispatch", "compliance_tracking"],
    hiddenCapabilities: []
  }
];

export async function seedIndustryFramework() {
  console.log("🏭 Seeding Multi-Industry Verticalization Framework...");
  
  // 1. Seed Capabilities
  console.log("📋 Creating capabilities...");
  for (const cap of CORE_CAPABILITIES) {
    await prisma.capability.upsert({
      where: { code: cap.code },
      update: {
        displayName: cap.displayName,
        description: cap.description,
        category: cap.category,
        isCore: cap.isCore,
        requiresSubscription: cap.requiresSubscription,
        minimumPlan: cap.minimumPlan,
        apiEndpoints: cap.apiEndpoints || [],
        uiComponents: cap.uiComponents || [],
        permissions: cap.permissions || [],
        dependencies: cap.dependencies || []
      },
      create: {
        code: cap.code,
        displayName: cap.displayName,
        description: cap.description,
        category: cap.category,
        isCore: cap.isCore,
        requiresSubscription: cap.requiresSubscription,
        minimumPlan: cap.minimumPlan,
        apiEndpoints: cap.apiEndpoints || [],
        uiComponents: cap.uiComponents || [],
        permissions: cap.permissions || [],
        dependencies: cap.dependencies || []
      }
    });
    console.log(`  ✅ ${cap.displayName}`);
  }
  
  // 2. Seed Industry Packs
  console.log("🏗️ Creating industry packs...");
  for (const industry of INDUSTRY_PACKS) {
    const pack = await prisma.industryPack.upsert({
      where: { industryCode: industry.industryCode },
      update: {
        displayName: industry.displayName,
        description: industry.description,
        naicsRanges: industry.naicsRanges,
        sicRanges: industry.sicRanges,
        leadFields: industry.leadFields,
        workflowSteps: industry.workflowSteps,
        catalogItems: industry.catalogItems,
        rateCards: industry.rateCards,
        formulaSet: industry.formulaSet,
        measurementUnits: industry.measurementUnits,
        contractTemplates: industry.contractTemplates || [],
        requiredCapabilities: industry.requiredCapabilities,
        optionalCapabilities: industry.optionalCapabilities,
        hiddenCapabilities: industry.hiddenCapabilities
      },
      create: {
        industryCode: industry.industryCode,
        displayName: industry.displayName,
        description: industry.description,
        naicsRanges: industry.naicsRanges,
        sicRanges: industry.sicRanges,
        leadFields: industry.leadFields,
        workflowSteps: industry.workflowSteps,
        catalogItems: industry.catalogItems,
        contractTemplates: industry.contractTemplates || [],
        rateCards: industry.rateCards,
        formulaSet: industry.formulaSet,
        measurementUnits: industry.measurementUnits,
        requiredCapabilities: industry.requiredCapabilities,
        optionalCapabilities: industry.optionalCapabilities,
        hiddenCapabilities: industry.hiddenCapabilities
      }
    });
    console.log(`  🏭 ${industry.displayName}`);
    
    // 3. Create Industry-Capability relationships
    console.log(`  📊 Linking capabilities for ${industry.industryCode}...`);
    
    // Required capabilities
    for (const capCode of industry.requiredCapabilities) {
      const capability = await prisma.capability.findUnique({ where: { code: capCode } });
      if (capability) {
        await prisma.industryCapability.upsert({
          where: { 
            industryPackId_capabilityId: {
              industryPackId: pack.id,
              capabilityId: capability.id
            }
          },
          update: {
            isRequired: true,
            isRecommended: true,
            defaultEnabled: true
          },
          create: {
            industryPackId: pack.id,
            capabilityId: capability.id,
            isRequired: true,
            isRecommended: true,
            defaultEnabled: true
          }
        });
      }
    }
    
    // Optional capabilities
    for (const capCode of industry.optionalCapabilities) {
      const capability = await prisma.capability.findUnique({ where: { code: capCode } });
      if (capability) {
        await prisma.industryCapability.upsert({
          where: { 
            industryPackId_capabilityId: {
              industryPackId: pack.id,
              capabilityId: capability.id
            }
          },
          update: {
            isRequired: false,
            isRecommended: true,
            defaultEnabled: false
          },
          create: {
            industryPackId: pack.id,
            capabilityId: capability.id,
            isRequired: false,
            isRecommended: true,
            defaultEnabled: false
          }
        });
      }
    }
  }
  
  console.log("🎉 Multi-Industry Framework seeded successfully!");
}

// Run if called directly
if (require.main === module) {
  seedIndustryFramework()
    .then(() => {
      console.log("✅ Industry framework seed complete");
      process.exit(0);
    })
    .catch((e) => {
      console.error("❌ Industry framework seed failed:", e);
      process.exit(1);
    });
}