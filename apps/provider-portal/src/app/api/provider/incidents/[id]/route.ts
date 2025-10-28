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

// GET /api/provider/incidents/[id]
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Fetch incident by id
    if (!id) return createNotFoundError("Incident not found");
    return createSuccessResponse({ id, title: "PLACEHOLDER", status: "open" });
  },
  "Failed to fetch incident",
);

// PUT /api/provider/incidents/[id]
const updateHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const _body = await parseRequestBody<Record<string, any>>(req);
    // PLACEHOLDER_block_phase2: Update incident fields
    return createSuccessResponse({ id, updated: true });
  },
  "Failed to update incident",
);

// DELETE /api/provider/incidents/[id]
const deleteHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Archive incident by id
    return createSuccessResponse({ id, deleted: true });
  },
  "Failed to delete incident",
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
