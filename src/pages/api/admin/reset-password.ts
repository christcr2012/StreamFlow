// src/pages/api/admin/reset-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await assertPermission(req, res, PERMS.PASSWORD_RESET))) return;

  try {
    const { userId, generatePassword = true, newPassword } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user to verify they exist
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new password or use provided one
    const password = newPassword || crypto.randomBytes(12).toString("hex");
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password and require change on next login
    await db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date()
      }
    });

    res.json({
      ok: true,
      message: "Password reset successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      ...(generatePassword && { temporaryPassword: password })
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
}