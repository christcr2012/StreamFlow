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

// GET /api/provider/monetization/offers
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List offers
  return createSuccessResponse({ offers: [] });
}, "Failed to list offers");

// POST /api/provider/monetization/offers
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const _body = await parseRequestBody<{
    name: string;
    priceId: string;
    startsAt?: string;
    endsAt?: string;
  }>(req);
  // PLACEHOLDER_block_phase2: Create an offer
  return createSuccessResponse({ created: true });
}, "Failed to create offer");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
