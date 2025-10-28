import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withIdempotencyRequired,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
  parseRequestBody,
  validateRequiredFields,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/incidents
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List incidents with filters (severity, status, since)
  return createSuccessResponse({ items: [], page: 1, pageSize: 50, total: 0 });
}, "Failed to list incidents");

// POST /api/provider/incidents
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<{
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    description?: string;
  }>(req);
  validateRequiredFields(body, ["title", "severity"]);
  // PLACEHOLDER_block_phase2: Create incident and notify on-call
  return createSuccessResponse({ created: true });
}, "Failed to create incident");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
