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
} from "@/lib/utils/api-response.utils";

// POST /api/provider/incidents/[id]/acknowledge
const ackHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const _body = await parseRequestBody<{ acknowledgedBy?: string }>(req);
    // PLACEHOLDER_block_phase2: Mark incident as acknowledged and record actor
    return createSuccessResponse({ id, acknowledged: true });
  },
  "Failed to acknowledge incident",
);

export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(ackHandler);
