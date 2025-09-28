// src/pages/api/admin/integrations.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require Owner-level permissions
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await assertPermission(req, res, PERMS.TENANT_CONFIGURE))) return;

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
    console.error("Integrations management error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { type, enabled } = req.query;
  
  const whereClause: any = {
    orgId: user.orgId,
  };
  
  if (type) {
    whereClause.type = type;
  }
  
  if (enabled !== undefined) {
    whereClause.enabled = enabled === 'true';
  }

  const integrations = await db.integration.findMany({
    where: whereClause,
    select: {
      id: true,
      type: true,
      name: true,
      enabled: true,
      metadata: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
      // Don't return config as it may contain secrets
    },
    orderBy: { createdAt: 'desc' },
  });

  await auditAction(req, {
    action: 'integrations_read',
    target: 'integration',
    category: 'DATA_ACCESS',
    details: { count: integrations.length },
  });

  res.json({ integrations });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { type, name, enabled = false, config = {}, metadata = {} } = req.body;

  if (!type || !name) {
    return res.status(400).json({ error: "Type and name are required" });
  }

  // Check if integration already exists
  const existing = await db.integration.findFirst({
    where: {
      orgId: user.orgId,
      type,
      name,
    },
  });

  if (existing) {
    return res.status(409).json({ error: "Integration with this type and name already exists" });
  }

  // Validate integration type
  const validTypes = ['SSO_SAML', 'SSO_OIDC', 'SCIM', 'WEBHOOK', 'OAUTH_APP', 'API_INTEGRATION', 'ACCOUNTING', 'COMMUNICATION'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid integration type" });
  }

  // For security, sanitize config to ensure no sensitive data is logged
  const sanitizedConfig = sanitizeConfig(config);

  const integration = await db.integration.create({
    data: {
      orgId: user.orgId,
      type,
      name,
      enabled,
      config: sanitizedConfig,
      metadata,
    },
  });

  await auditAction(req, {
    action: 'integration_create',
    target: 'integration',
    targetId: integration.id,
    category: 'ADMIN_ACTION',
    details: { type, name, enabled },
  });

  // Return integration without config for security
  const { config: _, ...safeIntegration } = integration;
  res.status(201).json({ integration: safeIntegration });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;
  const { name, enabled, config, metadata } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Integration ID required" });
  }

  const existingIntegration = await db.integration.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
    },
  });

  if (!existingIntegration) {
    return res.status(404).json({ error: "Integration not found" });
  }

  // Merge config if provided
  let updatedConfig = existingIntegration.config as any;
  if (config) {
    updatedConfig = { ...updatedConfig, ...sanitizeConfig(config) };
  }

  const updatedIntegration = await db.integration.update({
    where: { id: id as string },
    data: {
      ...(name && { name }),
      ...(enabled !== undefined && { enabled }),
      ...(config && { config: updatedConfig }),
      ...(metadata && { metadata: { ...(existingIntegration.metadata as any), ...metadata } }),
      ...(enabled && !existingIntegration.enabled && { lastSyncAt: new Date() }),
    },
  });

  await auditAction(req, {
    action: 'integration_update',
    target: 'integration',
    targetId: updatedIntegration.id,
    category: 'ADMIN_ACTION',
    details: { 
      name: updatedIntegration.name,
      type: updatedIntegration.type,
      changes: { name, enabled, hasConfigChanges: !!config },
    },
  });

  // Return integration without config for security
  const { config: _, ...safeIntegration } = updatedIntegration;
  res.json({ integration: safeIntegration });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Integration ID required" });
  }

  const integration = await db.integration.findFirst({
    where: {
      id: id as string,
      orgId: user.orgId,
    },
  });

  if (!integration) {
    return res.status(404).json({ error: "Integration not found" });
  }

  await db.integration.delete({
    where: { id: id as string },
  });

  await auditAction(req, {
    action: 'integration_delete',
    target: 'integration',
    targetId: integration.id,
    category: 'ADMIN_ACTION',
    details: { name: integration.name, type: integration.type },
  });

  res.json({ success: true });
}

/**
 * Sanitize integration config to remove or encrypt sensitive data
 */
function sanitizeConfig(config: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential'];
  const sanitized = { ...config };

  for (const [key, value] of Object.entries(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      // In production, you would encrypt these values
      sanitized[key] = typeof value === 'string' && value.length > 0 ? '[ENCRYPTED]' : value;
    }
  }

  return sanitized;
}