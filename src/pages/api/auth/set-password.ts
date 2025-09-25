// src/pages/api/auth/set-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/passwords";

// Allows:
// - First-time set (when no passwordHash exists)
// - Change password (requires currentPassword)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const email = (body.email || "").toString().trim().toLowerCase();
    const newPassword = (body.newPassword || "").toString();
    const currentPassword = body.currentPassword ? String(body.currentPassword) : null;

    if (!email || !newPassword) return res.status(400).json({ ok: false, error: "Email and newPassword required" });

    const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    // If user already has a password, require currentPassword
    if (user.passwordHash) {
      if (!currentPassword) return res.status(400).json({ ok: false, error: "currentPassword required" });
      const ok = await verifyPassword(currentPassword, user.passwordHash);
      if (!ok) return res.status(401).json({ ok: false, error: "Invalid current password" });
    }

    const hash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, mustChangePassword: false },
    });

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    console.error("/api/auth/set-password error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}
