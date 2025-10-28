import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { compose, withProviderAuth, withRateLimit } from "@/lib/api/middleware";

// GET /api/federation/usage
// Phase 1 scaffold: usage metrics (placeholder)
const getHandler = async (req: NextRequest) => {
  try {
    const { searchParams } = req.nextUrl;
    const subject = searchParams.get("subject") || "tenant"; // tenant|provider
    const subjectId = searchParams.get("subjectId") || undefined;
    const window = searchParams.get("window") || "30d";

    const data = {
      subject,
      subjectId: subjectId || null,
      window,
      items: [],
      totals: {},
    };

    return jsonOk(data);
  } catch (error) {
    console.error("Error fetching federation usage:", error);
    return jsonError(500, "internal_error", "Failed to fetch usage");
  }
};

export const GET = compose(
  withProviderAuth(),
  withRateLimit("analytics"),
)(getHandler);
