// src/pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Clear ALL authentication cookies for complete logout
  const cookieOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

  const cookies = [
    `ws_user=; ${cookieOptions}`,      // Client system cookie
    `ws_provider=; ${cookieOptions}`,  // Provider system cookie
    `ws_developer=; ${cookieOptions}`, // Developer system cookie
    `ws_accountant=; ${cookieOptions}` // Accountant system cookie
  ];

  res.setHeader("Set-Cookie", cookies);
  return res.status(200).json({ ok: true });
}
