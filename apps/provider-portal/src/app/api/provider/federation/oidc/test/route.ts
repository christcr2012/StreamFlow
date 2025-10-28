import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

// POST /api/provider/federation/oidc/test
const testHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Perform OIDC discovery and token flow test
  return createSuccessResponse({ ok: true, message: "OIDC test placeholder" });
}, "Failed to test OIDC");

export const POST = compose(withProviderAuth(), withAuditLog())(testHandler);
