import {
  getAllTenantHealthScores,
  TenantHealthScore,
} from "@/services/provider/tenant-health.service";
import TenantHealthClient from "./TenantHealthClient";

export const metadata = {
  title: "Tenant Health Dashboard | Provider Portal",
  description: "Monitor tenant health scores and churn risk",
};

export default async function TenantHealthPage() {
  let healthScores: TenantHealthScore[] = [];
  let error: string | null = null;

  try {
    healthScores = await getAllTenantHealthScores();
  } catch (err: any) {
    error = err.message || "Failed to load tenant health data";
    console.log(
      "Tenant health page: Database not available during build, using empty data",
    );
  }

  return (
    <div className="container-responsive">
      <div className="mb-6">
        <h1
          className="text-responsive-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Tenant Health Dashboard
        </h1>
        <p
          className="text-responsive-base mt-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Monitor tenant health scores, engagement metrics, and churn risk
          across all clients
        </p>
      </div>

      {error && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            color: "#ef4444",
          }}
        >
          <p className="font-medium">Error loading tenant health data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <TenantHealthClient initialHealthScores={healthScores} />
    </div>
  );
}
