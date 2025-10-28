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
} from "@/lib/utils/api-response.utils";

// POST /api/provider/billing/invoices/[id]/remind
const postHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Send payment reminder for invoice id
    // Phase 2: Integrate with email service and Stripe invoice reminders
    return createSuccessResponse(
      { invoiceId: id, reminded: true },
      "Reminder sent",
    );
  },
);

export const POST = compose(
  withProviderAuth(),
  withIdempotencyRequired(),
  withAuditLog(),
)(postHandler);
