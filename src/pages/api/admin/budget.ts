// src/pages/api/admin/budget.ts
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
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Budget management error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Get or create budget for organization
  let budget = await db.organizationBudget.findUnique({
    where: { orgId: user.orgId },
  });

  if (!budget) {
    // Create default budget if none exists
    budget = await db.organizationBudget.create({
      data: {
        orgId: user.orgId,
        monthlyLimitCents: 50000, // $500 default
        alertThreshold: 80,
        autoDisable: false,
        notifyOwners: true,
        currentSpendCents: 0,
      },
    });
  }

  // Get current month's usage across all feature modules
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const monthlyUsage = await db.featureUsage.aggregate({
    where: {
      orgId: user.orgId,
      createdAt: {
        gte: currentMonthStart,
      },
    },
    _sum: {
      costCents: true,
    },
  });

  const actualSpend = monthlyUsage._sum.costCents || 0;

  // Update current spend if different
  if (actualSpend !== budget.currentSpendCents) {
    budget = await db.organizationBudget.update({
      where: { orgId: user.orgId },
      data: { currentSpendCents: actualSpend },
    });
  }

  // Calculate metrics
  const utilizationPercentage = (actualSpend / budget.monthlyLimitCents) * 100;
  const remainingBudget = budget.monthlyLimitCents - actualSpend;
  const isOverBudget = actualSpend > budget.monthlyLimitCents;
  const isNearLimit = utilizationPercentage >= budget.alertThreshold;

  await auditAction(req, {
    action: 'budget_read',
    target: 'organization_budget',
    category: 'DATA_ACCESS',
    details: { currentSpend: actualSpend, utilizationPercentage },
  });

  res.json({
    budget: {
      ...budget,
      currentSpendCents: actualSpend,
    },
    metrics: {
      utilizationPercentage,
      remainingBudgetCents: remainingBudget,
      isOverBudget,
      isNearLimit,
      daysLeftInMonth: new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0).getDate() - new Date().getDate(),
    },
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Create initial budget (usually done automatically in GET)
  const {
    monthlyLimitCents = 50000,
    alertThreshold = 80,
    autoDisable = false,
    notifyOwners = true,
  } = req.body;

  // Check if budget already exists
  const existing = await db.organizationBudget.findUnique({
    where: { orgId: user.orgId },
  });

  if (existing) {
    return res.status(409).json({ error: "Budget already exists for this organization" });
  }

  const budget = await db.organizationBudget.create({
    data: {
      orgId: user.orgId,
      monthlyLimitCents,
      alertThreshold,
      autoDisable,
      notifyOwners,
      currentSpendCents: 0,
    },
  });

  await auditAction(req, {
    action: 'budget_create',
    target: 'organization_budget',
    targetId: budget.id,
    category: 'ADMIN_ACTION',
    details: { monthlyLimitCents, alertThreshold, autoDisable },
  });

  res.status(201).json({ budget });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const {
    monthlyLimitCents,
    alertThreshold,
    autoDisable,
    notifyOwners,
  } = req.body;

  // Get existing budget
  const existingBudget = await db.organizationBudget.findUnique({
    where: { orgId: user.orgId },
  });

  if (!existingBudget) {
    return res.status(404).json({ error: "Budget not found" });
  }

  // Validate inputs
  if (monthlyLimitCents !== undefined && monthlyLimitCents < 0) {
    return res.status(400).json({ error: "Monthly limit cannot be negative" });
  }

  if (alertThreshold !== undefined && (alertThreshold < 0 || alertThreshold > 100)) {
    return res.status(400).json({ error: "Alert threshold must be between 0 and 100" });
  }

  // Check if reducing limit would put organization over budget
  if (monthlyLimitCents !== undefined && monthlyLimitCents < existingBudget.currentSpendCents) {
    return res.status(400).json({ 
      error: "Cannot set limit below current spend",
      currentSpend: existingBudget.currentSpendCents,
    });
  }

  const updatedBudget = await db.organizationBudget.update({
    where: { orgId: user.orgId },
    data: {
      ...(monthlyLimitCents !== undefined && { monthlyLimitCents }),
      ...(alertThreshold !== undefined && { alertThreshold }),
      ...(autoDisable !== undefined && { autoDisable }),
      ...(notifyOwners !== undefined && { notifyOwners }),
    },
  });

  await auditAction(req, {
    action: 'budget_update',
    target: 'organization_budget',
    targetId: updatedBudget.id,
    category: 'ADMIN_ACTION',
    details: { 
      changes: { monthlyLimitCents, alertThreshold, autoDisable, notifyOwners },
      previousLimit: existingBudget.monthlyLimitCents,
    },
  });

  res.json({ budget: updatedBudget });
}