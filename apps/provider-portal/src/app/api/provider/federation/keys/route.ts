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

// GET /api/provider/federation/keys
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List federation signing keys
  return createSuccessResponse({ keys: [] });
}, "Failed to list federation keys");

// POST /api/provider/federation/keys
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<{ name: string; alg?: string }>(req);
  validateRequiredFields(body, ["name"]);
  // PLACEHOLDER_block_phase2: Create new signing key and return metadata
  return createSuccessResponse({ created: true });
}, "Failed to create federation key");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
