import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/analytics/snapshot
// Proxy/alias to existing /api/analytics/snapshot for Phase 1 structural parity
const getHandler = handleAsyncRoute(async (req: NextRequest) => {
  // PLACEHOLDER_block_phase2: Consider consolidating under one canonical path
  // Phase 2: Delegate to analytics snapshot service
  const url = new URL(req.url);
  url.pathname = url.pathname.replace(
    "/api/provider/analytics/snapshot",
    "/api/analytics/snapshot",
  );
  const res = await fetch(url.toString(), { headers: req.headers });
  if (!res.ok) {
    return createSuccessResponse({ metrics: {} });
  }
  const data = await res.json();
  return createSuccessResponse(data.data ?? data);
});

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
