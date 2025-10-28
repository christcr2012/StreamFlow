import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withRateLimit,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  createErrorResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";
import { getAllTenantsApiUsage } from "@/services/provider/api-usage.service";

// GET /api/provider/usage
// Thin alias to API usage service with analytics rate limit
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  const usage = await getAllTenantsApiUsage();
  return createSuccessResponse({ usage }, "Usage data retrieved successfully");
}, "Failed to fetch usage");

export const GET = compose(
  withProviderAuth(),
  withRateLimit("analytics"),
  withAuditLog(),
)(getHandler);
