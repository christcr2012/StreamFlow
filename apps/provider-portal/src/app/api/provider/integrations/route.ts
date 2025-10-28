import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
  parseRequestBody,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/integrations
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List available and connected integrations
  // Phase 2: Read from provider DB configuration
  return createSuccessResponse({ items: [] });
});

// POST /api/provider/integrations
const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Connect or configure integration
  // Phase 2: Validate payload and persist settings
  return createSuccessResponse(
    { id: "PLACEHOLDER_integration_id", ...body },
    "Integration configured",
    201,
  );
});

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const POST = compose(withProviderAuth(), withAuditLog())(postHandler);
