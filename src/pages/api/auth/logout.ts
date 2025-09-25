// src/pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  let cookie = "mv_user=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
  if (process.env.NODE_ENV === "production") cookie += "; Secure";

  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ ok: true });
}
