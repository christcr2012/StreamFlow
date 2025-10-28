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

// GET /api/provider/monetization/coupons
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List coupons
  return createSuccessResponse({ items: [], total: 0 });
}, "Failed to fetch coupons");

// POST /api/provider/monetization/coupons
const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Replace with Zod schema
  validateRequiredFields(body, ["code", "discountType", "amount"]);
  return createSuccessResponse(
    { id: "PLACEHOLDER_coupon_id" },
    "Coupon created",
    201,
  );
}, "Failed to create coupon");

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(postHandler);
