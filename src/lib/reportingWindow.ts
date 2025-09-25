// src/lib/reportingWindow.ts
import type { NextApiRequest } from "next";

/**
 * Range shorthands your APIs accept.
 * NOTE: We kept your existing ranges intact. Use the new `currentMonthRange`
 * for the dashboard summary (Step 7.1).
 */
export type RangeParam = "d7" | "d30" | "d90" | "all";

/** Default business timezone for “This Month” calculations. */
export const DEFAULT_TZ = process.env.DEFAULT_TZ || "America/Denver";

/* ----------------------------------------------------------------------------
 * Basic date helpers (existing behavior preserved)
 * ------------------------------------------------------------------------- */

export function parseDateOnly(s?: string): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/** Inclusive day window: `from` at 00:00 UTC, `to` at the given day 00:00 UTC. */
export function computeWindow(q: NextApiRequest["query"]): {
  from: Date;
  to: Date;
  label: RangeParam | "custom";
} {
  const now = new Date();
  const endQ = arrayFirst(q.end);
  const startQ = arrayFirst(q.start);
  const rangeQ = arrayFirst(q.range) as RangeParam | undefined;

  // Normalize to a clean UTC day boundary for TODAY
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = parseDateOnly(endQ) ?? todayUTC;
  const start = parseDateOnly(startQ);

  if (start && end) {
    const from = start <= end ? start : end;
    const to = end >= start ? end : start;
    return { from, to, label: "custom" };
  }

  const map: Record<RangeParam, number> = { d7: 7, d30: 30, d90: 90, all: 365 };
  const days = map[rangeQ || "d30"] ?? 30;
  const from = new Date(end);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return { from, to: end, label: (rangeQ || "d30") as RangeParam };
}

/** 23:59:59.999 UTC of the given date */
export function endOfDayUTC(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

/** Helper to safely read the first value of a query param (array or string). */
export function arrayFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Parse optional `limit` with sane defaults and a hard cap. */
export function parseLimit(
  q: NextApiRequest["query"],
  def = 10000,
  cap = 100000
): number {
  const raw = arrayFirst(q.limit);
  const n = Math.max(parseInt(raw || String(def), 10) || def, 1);
  return Math.min(n, cap);
}

/** Read optional string filters (e.g., status, sourceType). */
export function readStringFilter(
  q: NextApiRequest["query"],
  key: string
): string | undefined {
  const raw = q[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && typeof v === "string") {
    const trimmed = v.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

/* ----------------------------------------------------------------------------
 * Step 7.1 AUGMENT — Timezone-aware “current month” window (no extra deps)
 *
 * Purpose:
 *   Provide an accurate “This Month” range for dashboards & billing rollups
 *   in a business timezone (default America/Denver), handling DST correctly.
 *
 * What you get:
 *   currentMonthRange(tz) → { from, to }
 *     - `from` = 00:00:00.000 at local time on the 1st of this month, as a UTC Date
 *     - `to`   = 23:59:59.999 at local time on the last day of this month, as a UTC Date
 *
 * Implementation notes:
 *   - Uses Intl APIs to derive local Y/M/D and numeric UTC offset for a given tz.
 *   - Avoids adding date-fns/date-fns-tz dependencies.
 * ------------------------------------------------------------------------- */

/** Extracts Y/M/D for a given Date as seen in a target IANA timezone. */
function getYMDInTZ(d: Date, timeZone: string): { y: number; m: number; day: number } {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = f.formatToParts(d);
  const y = Number(parts.find(p => p.type === "year")?.value);
  const m = Number(parts.find(p => p.type === "month")?.value);
  const day = Number(parts.find(p => p.type === "day")?.value);
  return { y, m, day };
}

/** Parses a TZ offset like "GMT-06:00" → minutes (-360). */
function parseGmtOffsetToMinutes(label: string): number | null {
  // Expect strings like "GMT-06:00" / "GMT+05:30"
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(label);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2]);
  const mm = Number(m[3]);
  return sign * (hh * 60 + mm);
}

/** Gets the numeric offset, in minutes, of `timeZone` at instant `d`. */
function tzOffsetMinutesAt(d: Date, timeZone: string): number {
  // Use timeZoneName: 'shortOffset' to get labels like "GMT-06:00"
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const label = parts.find(p => p.type === "timeZoneName")?.value || "";
  const mins = parseGmtOffsetToMinutes(label);
  // Fallback: compute offset via wall-clock comparison if parsing fails
  if (mins == null) {
    const asLocal = new Date(
      fmt.format(d).replace(
        /(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}).*/,
        "$3-$1-$2T$4:$5:00Z"
      )
    );
    const diff = (asLocal.getTime() - d.getTime()) / 60000;
    return Math.round(diff);
  }
  return mins;
}

/**
 * Returns the UTC instant corresponding to LOCAL midnight (00:00:00.000) for
 * the given Y/M/D in `timeZone`.
 */
function localMidnightUTC(y: number, m1: number, d: number, timeZone: string): Date {
  // Create an approximate UTC instant for that date
  const approxUTC = new Date(Date.UTC(y, m1 - 1, d, 0, 0, 0, 0));
  // Get the correct offset at that local date
  const offsetMin = tzOffsetMinutesAt(approxUTC, timeZone);
  // Local midnight = UTC - offset
  return new Date(approxUTC.getTime() - offsetMin * 60_000);
}

/**
 * Returns the UTC instant corresponding to LOCAL 23:59:59.999 for the given
 * Y/M/D in `timeZone`.
 */
function localEndOfDayUTC(y: number, m1: number, d: number, timeZone: string): Date {
  const approxUTC = new Date(Date.UTC(y, m1 - 1, d, 23, 59, 59, 999));
  const offsetMin = tzOffsetMinutesAt(approxUTC, timeZone);
  return new Date(approxUTC.getTime() - offsetMin * 60_000);
}

/**
 * Step 7.1: “This Month” range in a target business timezone (default: America/Denver).
 * - from: first day of this month at 00:00 local (as a UTC Date)
 * - to:   last day of this month at 23:59:59.999 local (as a UTC Date)
 */
export function currentMonthRange(tz: string = DEFAULT_TZ): { from: Date; to: Date } {
  const now = new Date();
  const { y, m } = getYMDInTZ(now, tz); // month is 1–12
  const firstLocalUTC = localMidnightUTC(y, m, 1, tz);

  // Find number of days in this month (in target TZ) by moving to next month day 0.
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextMonthYear = m === 12 ? y + 1 : y;

  // Last day number = day component of "the day before the 1st of next month"
  const lastOfMonthDate = new Date(Date.UTC(nextMonthYear, nextMonth - 1, 1));
  lastOfMonthDate.setUTCDate(0); // move to last day of current month
  const lastDayNum = lastOfMonthDate.getUTCDate();

  const lastLocalUTC = localEndOfDayUTC(y, m, lastDayNum, tz);
  return { from: firstLocalUTC, to: lastLocalUTC };
}

/**
 * Convenience: Returns ISO strings for UI/debug.
 */
export function currentMonthRangeISO(tz: string = DEFAULT_TZ): { from: string; to: string } {
  const { from, to } = currentMonthRange(tz);
  return { from: from.toISOString(), to: to.toISOString() };
}
