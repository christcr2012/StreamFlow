import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAiOverview, type AiOverview } from "@/services/provider/ai.service";

export default async function ProviderAiPage() {
  const jar = await cookies();
  if (
    !jar.get("rs_provider") &&
    !jar.get("provider-session") &&
    !jar.get("ws_provider")
  ) {
    redirect("/provider/login");
  }

  // Fetch real AI usage data - fail fast if database unavailable
  let overview: AiOverview;

  try {
    overview = await getAiOverview();
  } catch (error) {
    console.error("AI page: Failed to load AI usage data:", error);

    // In production, show an error page instead of dev-only sample data
    if (process.env.NODE_ENV === "production") {
      return (
        <div className="space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-red-600">
              AI Usage Dashboard Unavailable
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Unable to load AI usage data. Please check database connection.
            </p>
          </header>
          <div className="rounded-xl p-8 bg-red-50 border border-red-200">
            <p className="text-red-800">
              Database connection failed. Please contact system administrator.
            </p>
          </div>
        </div>
      );
    }

    // In development, use empty data for build-time
    overview = {
      monthKey: new Date().toISOString().slice(0, 7),
      totals: {
        creditsUsed: 0,
        callCount: 0,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
      },
      topOrgs: [],
      recent: [],
    };
  }

  return (
    <div className="space-y-8">
      <header>
        <h1
          className="text-3xl font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: "var(--brand-gradient)" }}
        >
          AI Usage & Monetization
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Month {overview.monthKey} • Credits, tokens, and cost across all
          tenants
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Credits Used", value: overview.totals.creditsUsed },
          { label: "AI Calls", value: overview.totals.callCount },
          { label: "Tokens In", value: overview.totals.tokensIn },
          {
            label: "Cost (USD)",
            value: `$${overview.totals.costUsd.toFixed(2)}`,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl p-5"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--brand-primary)" }}
            >
              {k.value}
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Top Orgs */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--brand-primary)" }}
        >
          Top Organizations by AI Credits
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ color: "var(--text-secondary)" }}>
                <th className="text-left p-3">Organization</th>
                <th className="text-left p-3">Credits</th>
                <th className="text-left p-3">Tokens In</th>
                <th className="text-left p-3">Tokens Out</th>
                <th className="text-left p-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {overview.topOrgs.map((o) => (
                <tr
                  key={o.orgId}
                  className="border-t"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <td className="p-3" style={{ color: "var(--text-primary)" }}>
                    {o.orgName}
                  </td>
                  <td
                    className="p-3 font-mono"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    {o.creditsUsed}
                  </td>
                  <td
                    className="p-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {o.tokensIn}
                  </td>
                  <td
                    className="p-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {o.tokensOut}
                  </td>
                  <td
                    className="p-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    ${o.costUsd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Events */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--brand-primary)" }}
        >
          Recent AI Events
        </h2>
        <div className="space-y-2">
          {overview.recent.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--surface-2)" }}
            >
              <div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {e.orgName} •{" "}
                  <span
                    className="font-mono"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    {e.feature}
                  </span>{" "}
                  ({e.model})
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {new Date(e.createdAt).toLocaleString()}
                </div>
              </div>
              <div
                className="text-sm font-mono"
                style={{ color: "var(--brand-primary)" }}
              >
                {e.creditsUsed} cr
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
