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

// GET /api/provider/monetization/prices
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List prices
  return createSuccessResponse({ items: [], total: 0 });
}, "Failed to fetch prices");

// POST /api/provider/monetization/prices
const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Replace with Zod schema
  validateRequiredFields(body, ["planId", "currency", "unitAmount"]);
  return createSuccessResponse(
    { id: "PLACEHOLDER_price_id" },
    "Price created",
    201,
  );
}, "Failed to create price");

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(postHandler);
