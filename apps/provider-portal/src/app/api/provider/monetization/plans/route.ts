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

// GET /api/provider/monetization/plans
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List monetization plans
  return createSuccessResponse({ items: [], total: 0 });
}, "Failed to fetch plans");

// POST /api/provider/monetization/plans
const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Replace with Zod schema
  validateRequiredFields(body, ["name", "slug"]);
  return createSuccessResponse(
    { id: "PLACEHOLDER_plan_id" },
    "Plan created",
    201,
  );
}, "Failed to create plan");

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(postHandler);
