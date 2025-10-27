import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSecurityMetrics,
  getComplianceStatus,
  getDataRetentionPolicies,
  getEncryptionStatus,
  getVulnerabilityScans,
  getAccessControlReview,
  type SecurityMetrics,
  type ComplianceStatus,
  type DataRetentionPolicy,
  type EncryptionStatus,
  type VulnerabilityScan,
  type AccessControlReview,
} from "@/services/provider/compliance.service";
import ComplianceClient from "./ComplianceClient";

export default async function CompliancePage() {
  const cookieStore = await cookies();

  // Verify provider authentication
  if (
    !cookieStore.get("rs_provider") &&
    !cookieStore.get("provider-session") &&
    !cookieStore.get("ws_provider")
  ) {
    redirect("/login");
  }

  // Fetch all compliance data with build-time guard
  let metrics: SecurityMetrics = {
    totalAuditEvents: 0,
    recentEvents24h: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    dataAccessEvents: 0,
    configChanges: 0,
  };
  let compliance: ComplianceStatus[] = [];
  let retention: DataRetentionPolicy[] = [];
  let encryption: EncryptionStatus[] = [];
  let vulnerabilities: VulnerabilityScan[] = [];
  let access: AccessControlReview[] = [];

  try {
    [metrics, compliance, retention, encryption, vulnerabilities, access] =
      await Promise.all([
        getSecurityMetrics(),
        getComplianceStatus(),
        getDataRetentionPolicies(),
        getEncryptionStatus(),
        getVulnerabilityScans(),
        getAccessControlReview(),
      ]);
  } catch (error) {
    console.log(
      "CompliancePage: Database not available during build, using empty data",
    );
    // Keep default empty data structures
  }

  return (
    <ComplianceClient
      initialMetrics={metrics}
      initialCompliance={compliance}
      initialRetention={retention}
      initialEncryption={encryption}
      initialVulnerabilities={vulnerabilities}
      initialAccess={access}
    />
  );
}
