import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
  parseRequestBody,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/onboarding/templates
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List onboarding templates
  // Phase 2: Load from provider DB or filesystem templates
  return createSuccessResponse({ items: [] });
});

// POST /api/provider/onboarding/templates
const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Create or import onboarding template
  // Phase 2: Validate payload and persist
  return createSuccessResponse(
    { id: "PLACEHOLDER_template_id", ...body },
    "Template created",
    201,
  );
});

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const POST = compose(withProviderAuth(), withAuditLog())(postHandler);
