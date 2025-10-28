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

// GET /api/provider/tasks
const listHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List provider tasks (e.g., onboarding, compliance)
  return createSuccessResponse({ items: [], page: 1, pageSize: 50, total: 0 });
}, "Failed to list tasks");

// POST /api/provider/tasks
const createHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<{
    title: string;
    dueAt?: string;
    assignedTo?: string;
  }>(req);
  validateRequiredFields(body, ["title"]);
  // PLACEHOLDER_block_phase2: Create provider task
  return createSuccessResponse({ created: true });
}, "Failed to create task");

export const GET = compose(withProviderAuth(), withAuditLog())(listHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createHandler);
