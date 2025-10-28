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
} from "@/lib/utils/api-response.utils";

// GET /api/provider/monetization/invites
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List monetization invites
  return createSuccessResponse({ invites: [] });
}, "Failed to list invites");

// POST /api/provider/monetization/invites
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const _body = await parseRequestBody<{ email: string; role?: string }>(req);
  // PLACEHOLDER_block_phase2: Create invite and send email
  return createSuccessResponse({ created: true });
}, "Failed to create invite");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
