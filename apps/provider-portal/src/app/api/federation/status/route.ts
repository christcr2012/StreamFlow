import { jsonOk } from "@/lib/api/response";
import { compose, withProviderAuth, withRateLimit } from "@/lib/api/middleware";

// GET /api/federation/status
// Phase 1 scaffold: surface feature flags and static component health
const getHandler = async () => {
  try {
    const {
      FED_ENABLED,
      FED_OIDC_ENABLED,
      FED_RATE_LIMIT_ENABLED,
      FED_IDEMPOTENCY_ENABLED,
    } = await import("@/lib/config/federation");

    // Phase 2: compute real component health checks and counts
    const status = {
      federationEnabled: FED_ENABLED,
      components: {
        oidc: FED_OIDC_ENABLED ? "unknown" : "disabled",
        rateLimit: FED_RATE_LIMIT_ENABLED ? "unknown" : "disabled",
        idempotency: FED_IDEMPOTENCY_ENABLED ? "unknown" : "disabled",
        keys: "unknown",
        providers: "unknown",
      },
      updatedAt: new Date().toISOString(),
    } as const;

    return jsonOk(status);
  } catch (error) {
    // This route should be resilient; return minimal status on failure
    const fallback = {
      federationEnabled: false,
      components: {
        oidc: "unknown",
        rateLimit: "unknown",
        idempotency: "unknown",
        keys: "unknown",
        providers: "unknown",
      },
      updatedAt: new Date().toISOString(),
    } as const;
    return jsonOk(fallback);
  }
};

export const GET = compose(
  withProviderAuth(),
  withRateLimit("api"),
)(getHandler);
