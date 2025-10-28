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

// GET /api/fed/providers
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List providers registered for federation
  return createSuccessResponse({ items: [] });
}, "Failed to list providers");

// POST /api/fed/providers
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<{ name: string; baseUrl: string }>(req);
  validateRequiredFields(body, ["name", "baseUrl"]);
  // PLACEHOLDER_block_phase2: Register provider
  return createSuccessResponse({ created: true });
}, "Failed to create provider");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
