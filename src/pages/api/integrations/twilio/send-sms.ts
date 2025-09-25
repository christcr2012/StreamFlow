// src/pages/api/integrations/twilio/send-sms.ts
import { assertPermission, PERMS } from "@/lib/rbac";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }
    if (!(await assertPermission(req, res, PERMS.LEAD_READ))) return;

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      return res.status(501).json({ ok: false, error: "Twilio not configured" });
    }

    const rawBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const body = rawBody as Record<string, unknown>;
    const to = body.to as string | undefined;
    const text = body.text as string | undefined;
    if (!to || !text) {
      return res.status(400).json({ ok: false, error: "to and text required" });
    }

    const twilio = (await import("twilio")).default(sid, token);
    const result = await twilio.messages.create({ to, from, body: text });

    return res.status(200).json({ ok: true, sid: result.sid });
  } catch (e: unknown) {
    console.error("/api/integrations/twilio/send-sms error:", e);
    const msg = (e as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}
