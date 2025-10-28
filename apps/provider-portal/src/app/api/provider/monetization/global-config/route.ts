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

// GET /api/provider/monetization/global-config
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Return monetization global config
  return createSuccessResponse({
    currency: "USD",
    taxInclusive: false,
    invoiceGraceDays: 7,
    updatedAt: new Date().toISOString(),
  });
}, "Failed to fetch global config");

// PUT /api/provider/monetization/global-config
const putHandler = handleAsyncRoute(async (req: NextRequest) => {
  const _body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Validate and persist config
  return createSuccessResponse({ updated: true });
}, "Failed to update global config");

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const PUT = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(putHandler);
