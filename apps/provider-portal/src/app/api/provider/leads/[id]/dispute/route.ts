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

// POST /api/provider/leads/[id]/dispute
const createDisputeHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const body = await parseRequestBody<{ reason: string; details?: string }>(
      req,
    );
    validateRequiredFields(body, ["reason"]);
    // PLACEHOLDER_block_phase2: Record dispute for lead and trigger workflow
    return createSuccessResponse({ id, disputed: true });
  },
  "Failed to create lead dispute",
);

export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(createDisputeHandler);
