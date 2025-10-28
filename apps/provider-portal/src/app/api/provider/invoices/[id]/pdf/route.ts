import { NextRequest } from "next/server";
import { compose, withProviderAuth, withAuditLog } from "@/lib/api/middleware";
import {
  createSuccessResponse,
  handleAsyncRoute,
} from "@/lib/utils/api-response.utils";

// GET /api/provider/invoices/[id]/pdf
const getHandler = handleAsyncRoute(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = params;
    // PLACEHOLDER_block_phase2: Generate invoice PDF
    // Phase 2: Fetch invoice data and generate PDF via pdfkit
    return createSuccessResponse(
      { invoiceId: id, url: null },
      "PDF generation queued",
    );
  },
);

export const GET = compose(withProviderAuth(), withAuditLog())(getHandler);
