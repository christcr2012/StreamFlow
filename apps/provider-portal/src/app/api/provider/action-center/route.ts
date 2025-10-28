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

// GET /api/provider/action-center
// Thin alias to action items — Phase 1 scaffold with placeholder data
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Integrate with real action center service or reuse existing actions source
  return createSuccessResponse({ items: [], total: 0 });
}, "Failed to fetch action center");

export const GET = compose(
  withProviderAuth(),
  withRateLimit("api"),
  withAuditLog(),
)(getHandler);
