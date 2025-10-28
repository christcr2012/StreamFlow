import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withRateLimit,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/usage/feature
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Per-feature usage metrics across tenants
  return createSuccessResponse({ features: [] });
}, "Failed to fetch feature usage");

export const GET = compose(
  withProviderAuth(),
  withRateLimit("analytics"),
  withAuditLog(),
)(getHandler);
