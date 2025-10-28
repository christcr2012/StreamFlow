import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
  parseRequestBody,
  validateRequiredFields,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/clients
const getHandler = handleAsyncRoute(async (_req: NextRequest) => {
  // PLACEHOLDER_block_phase2: List provider clients across tenants
  // Phase 2: Query provider DB for clients, support filtering, pagination
  return createSuccessResponse({ items: [], meta: { total: 0 } });
});

// POST /api/provider/clients
const postHandler = handleAsyncRoute(async (req: NextRequest) => {
  const body = await parseRequestBody<Record<string, any>>(req);
  // PLACEHOLDER_block_phase2: Validate input
  // Phase 2: Use Zod schema and create client record in provider DB
  validateRequiredFields(body, ["name"]);
  return createSuccessResponse(
    { id: "PLACEHOLDER_client_id" },
    "Client created",
    201,
  );
});

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
export const POST = compose(withProviderAuth(), withAuditLog())(postHandler);
