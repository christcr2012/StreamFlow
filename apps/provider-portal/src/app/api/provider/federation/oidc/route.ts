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

// GET /api/provider/federation/oidc
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Return OIDC configuration status
  return createSuccessResponse({ configured: false });
}, "Failed to fetch OIDC config");

// POST /api/provider/federation/oidc
const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const _body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Save OIDC config
  return createSuccessResponse({ saved: true });
}, "Failed to save OIDC config");

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(postHandler);
