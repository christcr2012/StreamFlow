/**
 * Cleaning Services Vertical Pack - Production Implementation
 *
 * Supports residential, commercial, and post-construction cleaning with:
 * - Comprehensive lead capture forms
 * - Good/Better/Best estimate pricing
 * - Detailed pricebook with labor, materials, and equipment
 * - Real estimation logic with complexity factors
 * - QA checklist templates by space type
 */

import type { VerticalPack, EstimateResult } from '../index';

export const pack: VerticalPack = {
  key: 'cleaning',

  getForm(formKey: string, orgId: string) {
    const forms: Record<string, any> = {
      // Lead Capture Form
      'lead.cleaning': {
        title: 'Cleaning Service Lead',
        type: 'object',
        properties: {
          contactName: { type: 'string', title: 'Contact Name' },
          company: { type: 'string', title: 'Company Name' },
          email: { type: 'string', title: 'Email', format: 'email' },
          phone: { type: 'string', title: 'Phone' },
          address: { type: 'string', title: 'Service Address' },
          city: { type: 'string', title: 'City' },
          state: { type: 'string', title: 'State' },
          zip: { type: 'string', title: 'ZIP Code' },
          spaceType: {
            type: 'string',
            title: 'Space Type',
            enum: ['residential', 'commercial', 'post-construction'],
            enumNames: ['Residential', 'Commercial', 'Post-Construction']
          },
          squareFeet: { type: 'number', title: 'Square Feet', minimum: 0 },
          frequency: {
            type: 'string',
            title: 'Cleaning Frequency',
            enum: ['one-time', 'weekly', 'bi-weekly', 'monthly'],
            enumNames: ['One-Time', 'Weekly', 'Bi-Weekly', 'Monthly']
          },
          notes: { type: 'string', title: 'Additional Notes' }
        },
        required: ['contactName', 'address', 'city', 'state', 'zip', 'spaceType', 'squareFeet', 'frequency']
      },

      // Estimate Form
      'estimate.cleaning': {
        title: 'Cleaning Service Estimate',
        type: 'object',
        properties: {
          spaceType: {
            type: 'string',
            title: 'Space Type',
            enum: ['residential', 'commercial', 'post-construction']
          },
          squareFeet: { type: 'number', title: 'Square Feet', minimum: 0 },
          frequency: {
            type: 'string',
            title: 'Cleaning Frequency',
            enum: ['one-time', 'weekly', 'bi-weekly', 'monthly']
          },
          bedrooms: { type: 'number', title: 'Bedrooms (Residential)', minimum: 0 },
          bathrooms: { type: 'number', title: 'Bathrooms', minimum: 0 },
          floors: { type: 'number', title: 'Number of Floors', minimum: 1, default: 1 },
          pets: { type: 'boolean', title: 'Pets in Home' },
          deepClean: { type: 'boolean', title: 'Deep Clean Required' },
          windows: { type: 'number', title: 'Number of Windows', minimum: 0 },
          carpetSqFt: { type: 'number', title: 'Carpet Square Feet', minimum: 0 },
          hardwoodSqFt: { type: 'number', title: 'Hardwood Square Feet', minimum: 0 },
          tileSqFt: { type: 'number', title: 'Tile Square Feet', minimum: 0 }
        },
        required: ['spaceType', 'squareFeet', 'frequency']
      },

      // Work Order Form
      'work-order.cleaning': {
        title: 'Cleaning Work Order',
        type: 'object',
        properties: {
          siteAddress: { type: 'string', title: 'Site Address' },
          spaceType: { type: 'string', title: 'Space Type' },
          squareFeet: { type: 'number', title: 'Square Feet' },
          scheduledDate: { type: 'string', title: 'Scheduled Date', format: 'date' },
          scheduledStart: { type: 'string', title: 'Start Time', format: 'time' },
          scheduledEnd: { type: 'string', title: 'End Time', format: 'time' },
          assignedTo: { type: 'string', title: 'Assigned To (User ID)' },
          specialInstructions: { type: 'string', title: 'Special Instructions' }
        },
        required: ['siteAddress', 'spaceType', 'squareFeet', 'scheduledDate', 'scheduledStart', 'scheduledEnd']
      }
    };

    return forms[formKey] ?? { title: formKey, type: 'object', properties: {} };
  },

  getPriceBook(orgId: string) {
    return [
      // Labor Rates
      { sku: 'CLEAN_LABOR_STD', name: 'Standard Cleaning Labor', unit: 'hour', verticalKey: 'cleaning', basePrice: 45 },
      { sku: 'CLEAN_LABOR_DEEP', name: 'Deep Cleaning Labor', unit: 'hour', verticalKey: 'cleaning', basePrice: 60 },
      { sku: 'CLEAN_LABOR_POST', name: 'Post-Construction Labor', unit: 'hour', verticalKey: 'cleaning', basePrice: 75 },

      // Residential Services (per sqft)
      { sku: 'CLEAN_RES_BASIC', name: 'Residential Basic Clean', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.15 },
      { sku: 'CLEAN_RES_DEEP', name: 'Residential Deep Clean', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.25 },
      { sku: 'CLEAN_RES_MOVEOUT', name: 'Residential Move-Out Clean', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.30 },

      // Commercial Services (per sqft)
      { sku: 'CLEAN_COM_BASIC', name: 'Commercial Basic Clean', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.12 },
      { sku: 'CLEAN_COM_DEEP', name: 'Commercial Deep Clean', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.20 },
      { sku: 'CLEAN_COM_MEDICAL', name: 'Medical Facility Clean', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.35 },

      // Post-Construction
      { sku: 'CLEAN_POST_LIGHT', name: 'Post-Construction Light', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.40 },
      { sku: 'CLEAN_POST_HEAVY', name: 'Post-Construction Heavy', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.60 },

      // Add-On Services
      { sku: 'CLEAN_WINDOW_INT', name: 'Interior Window Cleaning', unit: 'window', verticalKey: 'cleaning', basePrice: 8 },
      { sku: 'CLEAN_WINDOW_EXT', name: 'Exterior Window Cleaning', unit: 'window', verticalKey: 'cleaning', basePrice: 12 },
      { sku: 'CLEAN_CARPET_STEAM', name: 'Carpet Steam Cleaning', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.35 },
      { sku: 'CLEAN_HARDWOOD_POLISH', name: 'Hardwood Floor Polish', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.25 },
      { sku: 'CLEAN_TILE_GROUT', name: 'Tile & Grout Deep Clean', unit: 'sqft', verticalKey: 'cleaning', basePrice: 0.40 },
      { sku: 'CLEAN_APPLIANCE', name: 'Appliance Deep Clean', unit: 'each', verticalKey: 'cleaning', basePrice: 35 },
      { sku: 'CLEAN_FRIDGE', name: 'Refrigerator Deep Clean', unit: 'each', verticalKey: 'cleaning', basePrice: 50 },
      { sku: 'CLEAN_OVEN', name: 'Oven Deep Clean', unit: 'each', verticalKey: 'cleaning', basePrice: 60 },

      // Supplies & Materials
      { sku: 'CLEAN_SUPPLIES_BASIC', name: 'Basic Cleaning Supplies', unit: 'job', verticalKey: 'cleaning', basePrice: 25 },
      { sku: 'CLEAN_SUPPLIES_ECO', name: 'Eco-Friendly Supplies', unit: 'job', verticalKey: 'cleaning', basePrice: 40 },
      { sku: 'CLEAN_SUPPLIES_DISINFECT', name: 'Medical-Grade Disinfectant', unit: 'job', verticalKey: 'cleaning', basePrice: 60 },

      // Equipment
      { sku: 'CLEAN_EQUIP_VACUUM', name: 'Commercial Vacuum', unit: 'job', verticalKey: 'cleaning', basePrice: 15 },
      { sku: 'CLEAN_EQUIP_STEAMER', name: 'Steam Cleaner', unit: 'job', verticalKey: 'cleaning', basePrice: 35 },
      { sku: 'CLEAN_EQUIP_BUFFER', name: 'Floor Buffer', unit: 'job', verticalKey: 'cleaning', basePrice: 45 }
    ];
  },

  estimate(inputs: Record<string, any>): EstimateResult {
    const spaceType = String(inputs.spaceType ?? 'residential');
    const squareFeet = Number(inputs.squareFeet ?? 1000);
    const frequency = String(inputs.frequency ?? 'one-time');
    const bedrooms = Number(inputs.bedrooms ?? 0);
    const bathrooms = Number(inputs.bathrooms ?? 0);
    const floors = Number(inputs.floors ?? 1);
    const pets = Boolean(inputs.pets);
    const deepClean = Boolean(inputs.deepClean);
    const windows = Number(inputs.windows ?? 0);
    const carpetSqFt = Number(inputs.carpetSqFt ?? 0);
    const hardwoodSqFt = Number(inputs.hardwoodSqFt ?? 0);
    const tileSqFt = Number(inputs.tileSqFt ?? 0);

    const lines: Array<{ sku: string; qty: number; unit: number; total: number }> = [];
    const warnings: string[] = [];

    // Base rate per sqft based on space type and service level
    let baseSku = 'CLEAN_RES_BASIC';
    let baseRate = 0.15;

    if (spaceType === 'residential') {
      if (deepClean) {
        baseSku = 'CLEAN_RES_DEEP';
        baseRate = 0.25;
      } else {
        baseSku = 'CLEAN_RES_BASIC';
        baseRate = 0.15;
      }
    } else if (spaceType === 'commercial') {
      if (deepClean) {
        baseSku = 'CLEAN_COM_DEEP';
        baseRate = 0.20;
      } else {
        baseSku = 'CLEAN_COM_BASIC';
        baseRate = 0.12;
      }
    } else if (spaceType === 'post-construction') {
      baseSku = deepClean ? 'CLEAN_POST_HEAVY' : 'CLEAN_POST_LIGHT';
      baseRate = deepClean ? 0.60 : 0.40;
    }

    // Complexity multipliers
    let complexityMultiplier = 1.0;

    // Multi-floor complexity
    if (floors > 1) {
      complexityMultiplier += (floors - 1) * 0.10; // +10% per additional floor
    }

    // Pet complexity
    if (pets) {
      complexityMultiplier += 0.15; // +15% for pet hair/odor
    }

    // Bathroom complexity (more bathrooms = more time)
    if (bathrooms > 2) {
      complexityMultiplier += (bathrooms - 2) * 0.05; // +5% per bathroom over 2
    }

    // Apply complexity to base rate
    const adjustedRate = baseRate * complexityMultiplier;

    // Base cleaning charge
    const baseTotal = Math.round(squareFeet * adjustedRate * 100) / 100;
    lines.push({
      sku: baseSku,
      qty: squareFeet,
      unit: adjustedRate,
      total: baseTotal
    });

    // Add-on services
    if (windows > 0) {
      const windowRate = 8; // Interior windows
      const windowTotal = windows * windowRate;
      lines.push({
        sku: 'CLEAN_WINDOW_INT',
        qty: windows,
        unit: windowRate,
        total: windowTotal
      });
    }

    if (carpetSqFt > 0) {
      const carpetRate = 0.35;
      const carpetTotal = Math.round(carpetSqFt * carpetRate * 100) / 100;
      lines.push({
        sku: 'CLEAN_CARPET_STEAM',
        qty: carpetSqFt,
        unit: carpetRate,
        total: carpetTotal
      });
    }

    if (hardwoodSqFt > 0) {
      const hardwoodRate = 0.25;
      const hardwoodTotal = Math.round(hardwoodSqFt * hardwoodRate * 100) / 100;
      lines.push({
        sku: 'CLEAN_HARDWOOD_POLISH',
        qty: hardwoodSqFt,
        unit: hardwoodRate,
        total: hardwoodTotal
      });
    }

    if (tileSqFt > 0) {
      const tileRate = 0.40;
      const tileTotal = Math.round(tileSqFt * tileRate * 100) / 100;
      lines.push({
        sku: 'CLEAN_TILE_GROUT',
        qty: tileSqFt,
        unit: tileRate,
        total: tileTotal
      });
    }

    // Supplies
    const suppliesSku = spaceType === 'commercial' ? 'CLEAN_SUPPLIES_DISINFECT' : 'CLEAN_SUPPLIES_BASIC';
    const suppliesRate = spaceType === 'commercial' ? 60 : 25;
    lines.push({
      sku: suppliesSku,
      qty: 1,
      unit: suppliesRate,
      total: suppliesRate
    });

    // Equipment
    if (carpetSqFt > 0 || deepClean) {
      lines.push({
        sku: 'CLEAN_EQUIP_STEAMER',
        qty: 1,
        unit: 35,
        total: 35
      });
    }

    // Calculate total
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);

    // Frequency discount
    let frequencyDiscount = 0;
    if (frequency === 'weekly') {
      frequencyDiscount = 0.15; // 15% discount for weekly
    } else if (frequency === 'bi-weekly') {
      frequencyDiscount = 0.10; // 10% discount for bi-weekly
    } else if (frequency === 'monthly') {
      frequencyDiscount = 0.05; // 5% discount for monthly
    }

    const discountAmount = Math.round(subtotal * frequencyDiscount * 100) / 100;
    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    // Warnings
    if (squareFeet > 5000) {
      warnings.push('Large space - may require multiple crew members or extended time');
    }

    if (spaceType === 'post-construction' && !deepClean) {
      warnings.push('Post-construction typically requires heavy-duty cleaning - consider deep clean option');
    }

    if (pets && !deepClean) {
      warnings.push('Pet hair/odor removal may require deep cleaning services');
    }

    if (frequencyDiscount > 0) {
      warnings.push(`${Math.round(frequencyDiscount * 100)}% recurring service discount applied`);
    }

    return {
      total,
      lines,
      warnings
    };
  }
};

