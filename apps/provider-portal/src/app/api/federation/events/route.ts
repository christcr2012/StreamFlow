import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { compose, withProviderAuth, withRateLimit } from "@/lib/api/middleware";

// GET /api/federation/events
// Phase 1 scaffold: returns empty events with filtering options
const getHandler = async (req: NextRequest) => {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") || undefined;
    const since = searchParams.get("since") || undefined; // ISO string
    const limit = Number(searchParams.get("limit") || "100");

    // Phase 2: fetch from event store or DB
    const events: any[] = [];

    return jsonOk({ type, since, limit, events });
  } catch (error) {
    console.error("Error fetching federation events:", error);
    return jsonError(500, "internal_error", "Failed to fetch events");
  }
};

export const GET = compose(
  withProviderAuth(),
  withRateLimit("analytics"),
)(getHandler);
