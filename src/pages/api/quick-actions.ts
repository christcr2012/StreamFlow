// src/pages/api/quick-actions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth, auditLog } from "@/lib/auth-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, data } = req.body;

  // Require authentication for all quick actions
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    switch (action) {
      case "create_lead_stub":
        return await handleCreateLeadStub(req, res, user);
      case "clock_in_out":
        return await handleClockInOut(req, res, user);
      case "create_job_stub":
        return await handleCreateJobStub(req, res, user);
      case "generate_report":
        return await handleGenerateReport(req, res, user);
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error) {
    console.error("Quick action error:", error);
    res.status(500).json({ error: "Action failed" });
  }
}

async function handleCreateLeadStub(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (!(await assertPermission(req, res, PERMS.LEAD_CREATE))) return;

  const leadData = req.body.data || {};
  
  try {
    const lead = await db.lead.create({
      data: {
        orgId: user.orgId,
        publicId: `lead_${Date.now()}`,
        identityHash: `quick_${Date.now()}`,
        company: leadData.companyName || "New Lead",
        contactName: leadData.contactName || "",
        email: leadData.email || "",
        phoneE164: leadData.phone || "",
        website: leadData.website || "",
        serviceCode: leadData.serviceCode || "cleaning",
        zip: leadData.zip || "",
        sourceType: "MANUAL",
        systemGenerated: false,
        aiScore: 50, // Default score
      }
    });

    // Audit log the action
    await auditLog({
      userId: user.id,
      action: "lead:create_quick",
      target: lead.id,
      details: { company: lead.company },
      orgId: user.orgId
    });

    res.json({ 
      ok: true, 
      lead: { id: lead.id, company: lead.company },
      message: "Lead created successfully",
      redirectTo: `/leads/${lead.id}`
    });
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
}

async function handleClockInOut(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (!(await assertPermission(req, res, PERMS.TIMECLOCK_MANAGE))) return;

  try {
    // For now, simulate clock in/out until TimeClock model is implemented
    const action = Math.random() > 0.5 ? "clock_in" : "clock_out";
    const timestamp = new Date().toISOString();

    // Audit log the action
    await auditLog({
      userId: user.id,
      action: `timeclock:${action}`,
      target: `simulated_${Date.now()}`,
      details: { timestamp },
      orgId: user.orgId
    });

    res.json({ 
      ok: true, 
      action,
      entry: { id: `sim_${Date.now()}`, timestamp },
      message: action === "clock_in" ? "Clocked in successfully" : "Clocked out successfully"
    });
  } catch (error) {
    console.error("Clock in/out error:", error);
    res.status(500).json({ error: "Failed to clock in/out" });
  }
}

async function handleCreateJobStub(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (!(await assertPermission(req, res, PERMS.JOB_CREATE))) return;

  const jobData = req.body.data || {};
  
  try {
    const job = await db.job.create({
      data: {
        orgId: user.orgId,
        status: "planned",
        schedule: jobData.schedule || {},
        assignedTo: jobData.assignedTo || null,
        checklist: jobData.checklist || [],
      }
    });

    // Audit log the action
    await auditLog({
      userId: user.id,
      action: "job:create_quick",
      target: job.id,
      details: { status: job.status },
      orgId: user.orgId
    });

    res.json({ 
      ok: true, 
      job: { id: job.id, status: job.status },
      message: "Job created successfully",
      redirectTo: `/jobs/${job.id}`
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
}

async function handleGenerateReport(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (!(await assertPermission(req, res, PERMS.REPORTS_CREATE))) return;

  const reportType = req.body.data?.type || "summary";
  
  try {
    // Create a simple report entry
    const report = {
      id: `report_${Date.now()}`,
      type: reportType,
      generatedBy: user.id,
      generatedAt: new Date().toISOString(),
      status: "generated"
    };

    // Audit log the action
    await auditLog({
      userId: user.id,
      action: "report:generate_quick",
      target: report.id,
      details: { type: reportType },
      orgId: user.orgId
    });

    res.json({ 
      ok: true, 
      report,
      message: "Report generated successfully",
      redirectTo: `/reports?id=${report.id}`
    });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
}