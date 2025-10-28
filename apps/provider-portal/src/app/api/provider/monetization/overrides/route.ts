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

// GET /api/provider/monetization/overrides
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List price overrides
  return createSuccessResponse({ overrides: [] });
}, "Failed to list overrides");

// POST /api/provider/monetization/overrides
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const _body = await parseRequestBody<{
    tenantId: string;
    priceId: string;
    amount: number;
  }>(req);
  // PLACEHOLDER_block_phase2: Create override
  return createSuccessResponse({ created: true });
}, "Failed to create override");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
