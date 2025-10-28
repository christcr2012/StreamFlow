import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withIdempotencyRequired,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  createNotFoundError,
  handleAsyncRoute,
  parseRequestBody,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/leads/[id]
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Fetch lead by id
    if (!id) return createNotFoundError("Lead not found");
    return createSuccessResponse({ id, name: "PLACEHOLDER" });
  },
  "Failed to fetch lead",
);

// PUT /api/provider/leads/[id]
const updateHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const _body = await parseRequestBody<Record<string, any>>(req);
    // PLACEHOLDER_block_phase2: Update lead by id
    return createSuccessResponse({ id, updated: true });
  },
  "Failed to update lead",
);

// DELETE /api/provider/leads/[id]
const deleteHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Delete/Archive lead by id
    return createSuccessResponse({ id, deleted: true });
  },
  "Failed to delete lead",
);

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const PUT = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(updateHandler);
export const DELETE = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(deleteHandler);
