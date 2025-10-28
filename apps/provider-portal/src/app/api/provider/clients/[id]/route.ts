import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  createNotFoundError,
  handleAsyncRoute,
  parseRequestBody,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/clients/[id]
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Fetch client by id
    // Phase 2: Query provider DB for client details
    if (!id) return createNotFoundError("Client");
    return createSuccessResponse({ id, name: "PLACEHOLDER" });
  },
);

// PUT /api/provider/clients/[id]
const putHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const body = await parseRequestBody<Record<string, any>>(req);
    // PLACEHOLDER_block_phase2: Update client fields
    // Phase 2: Validate and persist updates in provider DB
    return createSuccessResponse({ id, ...body }, "Client updated");
  },
);

// DELETE /api/provider/clients/[id]
const deleteHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Soft-delete client
    // Phase 2: Implement delete and cascading rules
    return createSuccessResponse({ id }, "Client deleted");
  },
);

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const PUT = compose(withProviderAuth(), withAuditLog())(putHandler);
export const DELETE = compose(
  withProviderAuth(),
  withAuditLog(),
)(deleteHandler);
