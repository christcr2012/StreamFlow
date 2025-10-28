import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { compose, withProviderAuth, withRateLimit } from "@/lib/api/middleware";

// GET /api/federation/analytics
// Phase 1 scaffold: returns empty analytics payload with requested parameters echoed back
const getHandler = async (req: NextRequest) => {
  try {
    const { searchParams } = req.nextUrl;
    const metric = searchParams.get("metric") || "all";
    const window = searchParams.get("window") || "24h"; // e.g., 1h, 24h, 7d
    const granularity = searchParams.get("granularity") || "hour"; // minute|hour|day

    // Phase 2: replace with real analytics aggregation
    const data = {
      metric,
      window,
      granularity,
      series: [],
      summary: {},
    };

    return jsonOk(data);
  } catch (error) {
    console.error("Error fetching federation analytics:", error);
    return jsonError(500, "internal_error", "Failed to fetch analytics");
  }
};

export const GET = compose(
  withProviderAuth(),
  withRateLimit("analytics"),
)(getHandler);
