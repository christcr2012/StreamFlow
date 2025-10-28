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

// POST /api/provider/subscriptions/[id]/extend
const extendHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const body = await parseRequestBody<{ days: number; reason?: string }>(req);
    validateRequiredFields(body, ["days"]);
    // PLACEHOLDER_block_phase2: Extend subscription end date by N days and audit
    return createSuccessResponse({ id, extendedByDays: body.days ?? 0 });
  },
  "Failed to extend subscription",
);

export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(extendHandler);
