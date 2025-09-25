import type { NextApiRequest, NextApiResponse } from "next";

function isoDay(offset = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.SAM_API_KEY;
  if (!apiKey) return res.status(200).json({ ok: false, error: "SAM_API_KEY not set" });

  const postedFrom = (req.query.from as string) || isoDay(-30); // tighter default window
  const postedTo   = (req.query.to as string)   || isoDay(0);
  const params = new URLSearchParams({ api_key: apiKey, postedFrom, postedTo, limit: "10" });

  const url = `https://api.sam.gov/opportunities/v2/search?${params.toString()}`;
  try {
    const r = await fetch(url);
    const text = await r.text();

    let json: unknown = null;
    try { json = JSON.parse(text); } catch {}

    if (r.status === 429) {
      // When rate limited, the response may contain fields like nextAccessTime
      // and message/description. Cast the parsed JSON to a record to safely
      // access these fields. If the fields are missing or of the wrong type,
      // fall back to defaults.
      const rec = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
      const throttleVal = typeof rec.nextAccessTime === "string" ? rec.nextAccessTime : "unknown";
      const msgVal = typeof rec.message === "string"
        ? rec.message
        : typeof rec.description === "string"
          ? rec.description
          : "Rate limited";
      return res.status(200).json({
        ok: false,
        status: 429,
        url,
        throttle: throttleVal,
        message: msgVal,
      });
    }

    const arrCandidate = (json as Record<string, unknown> | null | undefined)?.["opportunitiesData"];
    const arr = Array.isArray(arrCandidate) ? arrCandidate : [];
    return res.status(200).json({
      ok: r.ok,
      status: r.status,
      url,
      count: arr.length || 0,
      sample: arr.slice(0, 3),
      rawType: json ? "json" : "text",
      raw: json || text.slice(0, 800),
    });
  } catch (e: unknown) {
    const msg = (e as { message?: string } | undefined)?.message || "Unknown error";
    return res.status(500).json({ ok: false, error: msg, url });
  }
}