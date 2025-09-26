// src/pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function buildCookie(email: string) {
  let cookie = `ws_user=${encodeURIComponent(email)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  if (process.env.NODE_ENV === "production") cookie += "; Secure";
  return cookie;
}

// Tiny helper to detect form posts vs JSON
function isFormEncoded(req: NextApiRequest) {
  const ct = req.headers["content-type"] || "";
  return typeof ct === "string" && ct.includes("application/x-www-form-urlencoded");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }

    // Parse body (Next does it for us for JSON & urlencoded by default)
    // For forms, Next puts fields in req.body as an object too
    const body: Record<string, unknown> = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const emailInput = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();
    const explicitNext = (body.next || req.query.next)?.toString();
    // We'll determine the default redirect after we know the user's role

    if (!emailInput || !password) {
      if (isFormEncoded(req)) {
        // Redirect back to login with error
        res.setHeader("Location", `/login?error=missing`);
        return res.status(303).end();
      }
      return res.status(400).json({ ok: false, error: "Email and password required" });
    }

    const user = await db.user.findUnique({
      where: { email: emailInput },
      select: { email: true, passwordHash: true, status: true, role: true },
    });

    if (!user || user.status !== "active" || !user.passwordHash) {
      if (isFormEncoded(req)) {
        res.setHeader("Location", `/login?error=invalid`);
        return res.status(303).end();
      }
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      if (isFormEncoded(req)) {
        res.setHeader("Location", `/login?error=invalid`);
        return res.status(303).end();
      }
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // Set cookie and determine redirect based on role
    res.setHeader("Set-Cookie", buildCookie(user.email));
    
    // Determine appropriate redirect URL based on user role
    let redirectUrl: string;
    if (explicitNext && explicitNext.startsWith("/")) {
      // If there's an explicit next URL, use it
      redirectUrl = explicitNext;
    } else {
      // Default redirect based on role
      switch (user.role) {
        case "STAFF":
          redirectUrl = "/worker/home";
          break;
        default:
          redirectUrl = "/dashboard";
          break;
      }
    }

    if (isFormEncoded(req)) {
      res.setHeader("Location", redirectUrl);
      return res.status(303).end();
    }

    return res.status(200).json({ ok: true, redirect: redirectUrl });
  } catch (e: unknown) {
    console.error("/api/auth/login error:", e);
    if (isFormEncoded(req)) {
      res.setHeader("Location", `/login?error=server`);
      return res.status(303).end();
    }
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}
