import { scoreLead, type LeadLike, type ScoreResult } from "@/lib/leadScoring";

/**
 * Normalizes whatever your scoreLead returns into:
 *   { score: number, details: unknown }
 * so callers don’t need to know exact types.
 */
export async function scoreLeadNormalized(input: unknown): Promise<{ score: number; details: unknown }> {
  try {
    // Cast the unknown input to LeadLike for scoreLead. scoreLead always returns
    // a ScoreResult, but we preserve the generic handling in case of future
    // changes (e.g. returning a number).
    const res: ScoreResult | number = await scoreLead(input as LeadLike);
    if (typeof res === "number") {
      return { score: res, details: { score: res } };
    }
    if (res && typeof res === "object") {
      const maybeScore = (res as ScoreResult).score;
      return { score: typeof maybeScore === "number" ? maybeScore : 0, details: res };
    }
    return { score: 0, details: {} };
  } catch {
    return { score: 0, details: {} };
  }
}

