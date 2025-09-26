// src/pages/api/admin/feature-modules.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require Owner-level permissions
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await assertPermission(req, res, PERMS.FEATURE_TOGGLE))) return;

  try {
    switch (req.method) {
      case "GET":
        return await handleGet(req, res, user);
      case "POST":
        return await handlePost(req, res, user);
      case "PUT":
        return await handlePut(req, res, user);
      case "DELETE":
        return await handleDelete(req, res, user);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Feature modules error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { enabled, category } = req.query;
  
  const whereClause: any = {
    orgId: user.orgId,
  };
  
  if (enabled !== undefined) {
    whereClause.enabled = enabled === 'true';
  }
  
  if (category) {
    whereClause.category = category;
  }

  const modules = await db.featureModule.findMany({
    where: whereClause,
    include: {
      usageEvents: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate usage metrics for each module
  const modulesWithMetrics = modules.map(module => {
    const currentMonthUsage = module.usageEvents.reduce((sum, event) => sum + event.amount, 0);
    const currentMonthCost = module.usageEvents.reduce((sum, event) => sum + event.costCents, 0);
    
    return {
      ...module,
      currentUsage: {
        amount: currentMonthUsage,
        limit: module.usageLimit || 0,
        percentage: module.usageLimit ? (currentMonthUsage / module.usageLimit) * 100 : 0,
      },
      currentCost: {
        cents: currentMonthCost,
        budgetCents: module.monthlyBudget || 0,
        percentage: module.monthlyBudget ? (currentMonthCost / module.monthlyBudget) * 100 : 0,
      },
      usageEvents: undefined, // Remove from response to reduce size
    };
  });

  await auditAction(req, {
    action: 'feature_modules_read',
    target: 'feature_module',
    category: 'DATA_ACCESS',
    details: { count: modules.length },
  });

  res.json({ modules: modulesWithMetrics });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { moduleKey, name, description, category, enabled = false, usageLimit, costPerUnit, monthlyBudget, config = {} } = req.body;

  if (!moduleKey || !name || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check if module already exists
  const existing = await db.featureModule.findFirst({
    where: {
      orgId: user.orgId,
      moduleKey,
    },
  });

  if (existing) {
    return res.status(409).json({ error: "Feature module already exists" });
  }

  // Check budget constraints
  if (enabled && monthlyBudget) {
    const budget = await db.organizationBudget.findUnique({
      where: { orgId: user.orgId },
    });

    if (budget && budget.currentSpendCents + monthlyBudget > budget.monthlyLimitCents) {
      return res.status(400).json({ error: "Would exceed monthly budget limit" });
    }
  }

  const module = await db.featureModule.create({
    data: {
      orgId: user.orgId,
      moduleKey,
      name,
      description,
      category,
      enabled,
      usageLimit,
      costPerUnit,
      monthlyBudget,
      config,
    },
  });

  await auditAction(req, {
    action: 'feature_module_create',
    target: 'feature_module',
    targetId: module.id,
    category: 'ADMIN_ACTION',
    details: { moduleKey, name, enabled },
  });

  res.status(201).json({ module });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;
  const { enabled, usageLimit, costPerUnit, monthlyBudget, config, name, description } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Module ID required" });
  }

  const existingModule = await db.featureModule.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
    },
  });

  if (!existingModule) {
    return res.status(404).json({ error: "Feature module not found" });
  }

  // Check budget constraints if enabling or increasing budget
  if (enabled !== undefined || monthlyBudget !== undefined) {
    const budget = await db.organizationBudget.findUnique({
      where: { orgId: user.orgId },
    });

    if (budget) {
      const newBudget = monthlyBudget ?? existingModule.monthlyBudget ?? 0;
      const willBeEnabled = enabled ?? existingModule.enabled;
      
      if (willBeEnabled && budget.autoDisable) {
        const budgetIncrease = newBudget - (existingModule.monthlyBudget ?? 0);
        if (budget.currentSpendCents + budgetIncrease > budget.monthlyLimitCents) {
          return res.status(400).json({ error: "Would exceed monthly budget limit" });
        }
      }
    }
  }

  const updatedModule = await db.featureModule.update({
    where: { id: id as string },
    data: {
      ...(enabled !== undefined && { enabled }),
      ...(usageLimit !== undefined && { usageLimit }),
      ...(costPerUnit !== undefined && { costPerUnit }),
      ...(monthlyBudget !== undefined && { monthlyBudget }),
      ...(config && { config }),
      ...(name && { name }),
      ...(description && { description }),
    },
  });

  await auditAction(req, {
    action: 'feature_module_update',
    target: 'feature_module',
    targetId: updatedModule.id,
    category: 'ADMIN_ACTION',
    details: { 
      moduleKey: updatedModule.moduleKey,
      changes: { enabled, usageLimit, costPerUnit, monthlyBudget },
    },
  });

  res.json({ module: updatedModule });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Module ID required" });
  }

  const module = await db.featureModule.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
    },
  });

  if (!module) {
    return res.status(404).json({ error: "Feature module not found" });
  }

  // Delete related usage events first
  await db.featureUsage.deleteMany({
    where: { moduleId: id as string },
  });

  await db.featureModule.delete({
    where: { id: id as string },
  });

  await auditAction(req, {
    action: 'feature_module_delete',
    target: 'feature_module',
    targetId: module.id,
    category: 'ADMIN_ACTION',
    details: { moduleKey: module.moduleKey, name: module.name },
  });

  res.json({ success: true });
}