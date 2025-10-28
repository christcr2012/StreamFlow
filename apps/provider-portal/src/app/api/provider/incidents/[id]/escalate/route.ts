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

// POST /api/provider/incidents/[id]/escalate
const escalateHandler = handleAsyncRoute(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    const body = await parseRequestBody<{
      level: "medium" | "high" | "critical";
      reason?: string;
    }>(req);
    validateRequiredFields(body, ["level"]);
    // PLACEHOLDER_block_phase2: Escalate incident and notify on-call
    return createSuccessResponse({ id, escalatedTo: body.level });
  },
  "Failed to escalate incident",
);

export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(escalateHandler);
