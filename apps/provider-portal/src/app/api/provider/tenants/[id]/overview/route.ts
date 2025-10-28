import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/tenants/[id]/overview
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Aggregate overview for tenant (summary KPIs)
    return createSuccessResponse({ tenantId: id, kpis: {}, sections: {} });
  },
  "Failed to fetch tenant overview",
);

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
