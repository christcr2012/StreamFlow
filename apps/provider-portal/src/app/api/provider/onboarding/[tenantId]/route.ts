import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
  parseRequestBody,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/onboarding/[tenantId]
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { tenantId: string } }) => {
    const { tenantId } = params;
    // PLACEHOLDER_block_phase2: Load onboarding status for tenant
    // Phase 2: Query provider DB for onboarding state machine
    return createSuccessResponse({ tenantId, steps: [], status: "pending" });
  },
);

// PUT /api/provider/onboarding/[tenantId]
const putHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { tenantId: string } }) => {
    const { tenantId } = params;
    const body = await parseRequestBody<Record<string, any>>(req);
    // PLACEHOLDER_block_phase2: Update onboarding step/status
    // Phase 2: Validate transition and persist
    return createSuccessResponse({ tenantId, ...body }, "Onboarding updated");
  },
);

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const PUT = compose(withProviderAuth(), withAuditLog())(putHandler);
