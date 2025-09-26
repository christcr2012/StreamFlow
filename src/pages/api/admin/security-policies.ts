// src/pages/api/admin/security-policies.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require Owner-level permissions
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await assertPermission(req, res, PERMS.POLICY_MANAGE))) return;

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
    console.error("Security policies error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { category, enabled } = req.query;
  
  const whereClause: any = {
    orgId: user.orgId,
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  if (enabled !== undefined) {
    whereClause.enabled = enabled === 'true';
  }

  const policies = await db.securityPolicy.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });

  await auditAction(req, {
    action: 'security_policies_read',
    target: 'security_policy',
    category: 'DATA_ACCESS',
    details: { count: policies.length },
  });

  res.json({ policies });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { category, name, enabled = true, config } = req.body;

  if (!category || !name || !config) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check if policy already exists
  const existing = await db.securityPolicy.findFirst({
    where: {
      orgId: user.orgId,
      category,
      name,
    },
  });

  if (existing) {
    return res.status(409).json({ error: "Policy already exists" });
  }

  const policy = await db.securityPolicy.create({
    data: {
      orgId: user.orgId,
      category,
      name,
      enabled,
      config,
      lastUpdatedBy: user.id,
    },
  });

  await auditAction(req, {
    action: 'security_policy_create',
    target: 'security_policy',
    targetId: policy.id,
    category: 'POLICY_CHANGE',
    details: { name, category, enabled },
  });

  res.status(201).json({ policy });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;
  const { enabled, config, name } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Policy ID required" });
  }

  const existingPolicy = await db.securityPolicy.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
    },
  });

  if (!existingPolicy) {
    return res.status(404).json({ error: "Policy not found" });
  }

  const updatedPolicy = await db.securityPolicy.update({
    where: { id: id as string },
    data: {
      ...(enabled !== undefined && { enabled }),
      ...(config && { config }),
      ...(name && { name }),
      lastUpdatedBy: user.id,
      version: existingPolicy.version + 1,
    },
  });

  await auditAction(req, {
    action: 'security_policy_update',
    target: 'security_policy',
    targetId: updatedPolicy.id,
    category: 'POLICY_CHANGE',
    details: { 
      changes: { enabled, config, name },
      previousVersion: existingPolicy.version,
      newVersion: updatedPolicy.version,
    },
  });

  res.json({ policy: updatedPolicy });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Policy ID required" });
  }

  const policy = await db.securityPolicy.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
    },
  });

  if (!policy) {
    return res.status(404).json({ error: "Policy not found" });
  }

  await db.securityPolicy.delete({
    where: { id: id as string },
  });

  await auditAction(req, {
    action: 'security_policy_delete',
    target: 'security_policy',
    targetId: policy.id,
    category: 'POLICY_CHANGE',
    details: { name: policy.name, category: policy.category },
  });

  res.json({ success: true });
}