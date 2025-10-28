import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/federation
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Return federation status/capabilities
  return createSuccessResponse({
    status: "ok",
    capabilities: ["oidc", "hmac", "webhooks"],
  });
}, "Failed to fetch federation status");

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
