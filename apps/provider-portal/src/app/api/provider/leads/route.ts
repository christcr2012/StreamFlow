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

// GET /api/provider/leads
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List leads with filters (status, source, date range)
  return createSuccessResponse({ items: [], page: 1, pageSize: 50, total: 0 });
}, "Failed to list leads");

// POST /api/provider/leads
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<{
    name: string;
    email?: string;
    phone?: string;
    source?: string;
  }>(req);
  validateRequiredFields(body, ["name"]);
  // PLACEHOLDER_block_phase2: Create a new lead record
  return createSuccessResponse({ created: true });
}, "Failed to create lead");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
