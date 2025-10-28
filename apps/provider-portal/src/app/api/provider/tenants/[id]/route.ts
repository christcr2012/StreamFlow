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
} from "@/lib/utils/api-response.utils";

// GET /api/provider/tenants/[id]
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Fetch tenant by id from provider DB
    // Return 404 if not found in Phase 2
    return createSuccessResponse({ id, name: "PLACEHOLDER_tenant" });
  },
  "Failed to fetch tenant",
);

// PUT /api/provider/tenants/[id]
const putHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Update tenant fields
    // Return createNotFoundError() when id missing in Phase 2
    return createSuccessResponse({ id, updated: true });
  },
  "Failed to update tenant",
);

// DELETE /api/provider/tenants/[id]
const deleteHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Delete or archive tenant
    // Return createNotFoundError() when id missing in Phase 2
    return createSuccessResponse({ id, deleted: true });
  },
  "Failed to delete tenant",
);

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const PUT = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(putHandler);
export const DELETE = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(deleteHandler);
