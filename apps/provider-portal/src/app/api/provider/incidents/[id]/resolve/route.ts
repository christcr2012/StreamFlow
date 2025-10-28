import { NextRequest } from "next/server";
import {
  compose,
  withProviderAuth,
  withAuditLog,
  withIdempotencyRequired,
} from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
  parseRequestBody,
  validateRequiredFields,
} from "@/lib/utils/api-response.utils";

// POST /api/provider/incidents/[id]/resolve
const resolveHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const body = await parseRequestBody<{ reason: string }>(req);
    validateRequiredFields(body, ["reason"]);
    // PLACEHOLDER_block_phase2: Mark incident as resolved and record reason
    return createSuccessResponse({ id, resolved: true });
  },
  "Failed to resolve incident",
);

export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(resolveHandler);
