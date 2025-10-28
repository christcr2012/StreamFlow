import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withIdempotencyRequired,
  withRateLimit,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
  parseRequestBody,
  validateRequiredFields,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/tenants/[id]/tasks
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Query tasks for tenant id
    return createSuccessResponse({ items: [], tenantId: id, total: 0 });
  },
  "Failed to fetch tenant tasks",
);

// POST /api/provider/tenants/[id]/tasks
const postHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const body = await parseRequestBody<Record<string, any>>(req);
    // PLACEHOLDER_block_phase2: Replace with Zod; validateRequiredFields(body, ['title'])
    validateRequiredFields(body, ["title"]);
    return createSuccessResponse(
      { id: "PLACEHOLDER_task_id", tenantId: id },
      "Task created",
      201,
    );
  },
  "Failed to create tenant task",
);

export const GET = compose(
  withProviderAuth(),
  withRateLimit("api"),
  withAuditLog(),
)(getHandler);
export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(postHandler);
