import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  createNotFoundError,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

// GET /api/fed/providers/tenants/[id]
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Fetch mapping/details for federated tenant
    if (!id) return createNotFoundError("Tenant not found");
    return createSuccessResponse({ id, status: "ok" });
  },
  "Failed to fetch provider tenant",
);

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
