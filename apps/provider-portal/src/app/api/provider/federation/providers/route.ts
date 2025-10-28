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

// GET /api/provider/federation/providers
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List registered federation providers
  return createSuccessResponse({ providers: [] });
}, "Failed to list federation providers");

// POST /api/provider/federation/providers
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<{ name: string; baseUrl: string }>(req);
  validateRequiredFields(body, ["name", "baseUrl"]);
  // PLACEHOLDER_block_phase2: Register a new provider
  return createSuccessResponse({ created: true });
}, "Failed to create federation provider");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
