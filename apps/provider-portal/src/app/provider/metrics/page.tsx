import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProviderMetricsPage() {
  const jar = await cookies();
  if (
    !jar.get("rs_provider") &&
    !jar.get("provider-session") &&
    !jar.get("ws_provider")
  ) {
    redirect("/provider/login");
  }

  // Query funnel metrics from Activity table with build-time guard
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let inviteCreated30d = 0,
    inviteAccepted30d = 0,
    publicAttempt30d = 0,
    publicSuccess30d = 0,
    inviteCreated7d = 0,
    inviteAccepted7d = 0,
    publicAttempt7d = 0,
    publicSuccess7d = 0;

  try {
    [
      inviteCreated30d,
      inviteAccepted30d,
      publicAttempt30d,
      publicSuccess30d,
      inviteCreated7d,
      inviteAccepted7d,
      publicAttempt7d,
      publicSuccess7d,
    ] = await Promise.all([
      prisma.activity.count({
        where: { action: "invite_created", createdAt: { gte: last30Days } },
      }),
      prisma.activity.count({
        where: { action: "invite_accepted", createdAt: { gte: last30Days } },
      }),
      prisma.activity.count({
        where: { action: "public_attempt", createdAt: { gte: last30Days } },
      }),
      prisma.activity.count({
        where: { action: "public_success", createdAt: { gte: last30Days } },
      }),
      prisma.activity.count({
        where: { action: "invite_created", createdAt: { gte: last7Days } },
      }),
      prisma.activity.count({
        where: { action: "invite_accepted", createdAt: { gte: last7Days } },
      }),
      prisma.activity.count({
        where: { action: "public_attempt", createdAt: { gte: last7Days } },
      }),
      prisma.activity.count({
        where: { action: "public_success", createdAt: { gte: last7Days } },
      }),
    ]);
  } catch (error) {
    console.log(
      "ProviderMetricsPage: Database not available during build, using zero counts",
    );
    // All metrics default to 0 (already initialized above)
  }

  // Calculate conversion rates
  const inviteConversion30d =
    inviteCreated30d > 0
      ? ((inviteAccepted30d / inviteCreated30d) * 100).toFixed(1)
      : "0.0";
  const publicConversion30d =
    publicAttempt30d > 0
      ? ((publicSuccess30d / publicAttempt30d) * 100).toFixed(1)
      : "0.0";
  const inviteConversion7d =
    inviteCreated7d > 0
      ? ((inviteAccepted7d / inviteCreated7d) * 100).toFixed(1)
      : "0.0";
  const publicConversion7d =
    publicAttempt7d > 0
      ? ((publicSuccess7d / publicAttempt7d) * 100).toFixed(1)
      : "0.0";

  // Alert thresholds
  const inviteAlert = parseFloat(inviteConversion30d) < 50;
  const publicAlert = parseFloat(publicConversion30d) < 50;

  return (
    <div className="space-y-8">
      <header>
        <h1
          className="text-3xl font-bold bg-clip-text text-transparent"
          style={{ backgroundImage: "var(--brand-gradient)" }}
        >
          Conversion Metrics
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Onboarding funnel performance and conversion rates
        </p>
      </header>

      {/* Alerts */}
      {(inviteAlert || publicAlert) && (
        <div
          className="rounded-xl p-6"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "#ef4444" }}
          >
            ⚠️ Low Conversion Alert
          </h2>
          {inviteAlert && (
            <p style={{ color: "#ef4444" }}>
              Invite conversion rate is below 50% ({inviteConversion30d}%)
            </p>
          )}
          {publicAlert && (
            <p style={{ color: "#ef4444" }}>
              Public onboarding conversion rate is below 50% (
              {publicConversion30d}%)
            </p>
          )}
        </div>
      )}

      {/* 30-Day Metrics */}
      <div>
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Last 30 Days
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Invites Created
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {inviteCreated30d.toLocaleString()}
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Invites Accepted
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {inviteAccepted30d.toLocaleString()}
            </div>
            <div
              className="text-xs mt-1"
              style={{
                color: inviteAlert ? "#ef4444" : "var(--text-secondary)",
              }}
            >
              {inviteConversion30d}% conversion
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Public Attempts
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {publicAttempt30d.toLocaleString()}
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Public Success
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {publicSuccess30d.toLocaleString()}
            </div>
            <div
              className="text-xs mt-1"
              style={{
                color: publicAlert ? "#ef4444" : "var(--text-secondary)",
              }}
            >
              {publicConversion30d}% conversion
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Metrics */}
      <div>
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Last 7 Days
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Invites Created
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {inviteCreated7d.toLocaleString()}
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Invites Accepted
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {inviteAccepted7d.toLocaleString()}
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {inviteConversion7d}% conversion
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Public Attempts
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {publicAttempt7d.toLocaleString()}
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Public Success
            </div>
            <div
              className="text-3xl font-bold mt-2"
              style={{ color: "var(--brand-primary)" }}
            >
              {publicSuccess7d.toLocaleString()}
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {publicConversion7d}% conversion
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Recommendations
        </h2>
        <ul className="space-y-2" style={{ color: "var(--text-secondary)" }}>
          {inviteAlert && (
            <li>
              • Invite conversion is low. Consider: simplifying onboarding flow,
              adding follow-up emails, or reviewing invite messaging.
            </li>
          )}
          {publicAlert && (
            <li>
              • Public onboarding conversion is low. Consider: improving landing
              page, adding social proof, or offering incentives.
            </li>
          )}
          {!inviteAlert && !publicAlert && (
            <li>✅ All conversion rates are healthy (above 50% threshold)</li>
          )}
          <li>• Monitor trends over time to identify patterns</li>
          <li>• Set up automated alerts for conversion drops</li>
        </ul>
      </div>
    </div>
  );
}
