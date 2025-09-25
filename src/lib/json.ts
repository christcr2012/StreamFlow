/**
 * Lightweight JSON helpers you *may* adopt gradually.
 * Safe to add; existing code does not need to change.
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [k: string]: JsonValue | undefined };
export type JsonArray = JsonValue[];

export function isJsonObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function getJsonPath<T extends JsonValue = JsonValue>(
  obj: unknown,
  path: (string | number)[]
): T | undefined {
  let cur: any = obj;
  for (const seg of path) {
    if (cur == null) return undefined;
    cur = cur[seg as any];
  }
  return cur as T | undefined;
}

/** Narrow pattern for your `enrichmentJson.billing` usage */
export type BillingInfo = {
  unitPriceCents?: number;
  billableEligible?: boolean;
  billedAt?: string | null;
  reason?: string;
};

export function readBillingInfo(enrichmentJson: unknown): BillingInfo | undefined {
  if (!isJsonObject(enrichmentJson)) return undefined;
  const b = enrichmentJson["billing"];
  if (!isJsonObject(b)) return undefined;

  const out: BillingInfo = {};
  const up = b["unitPriceCents"];
  const el = b["billableEligible"];
  const ba = b["billedAt"];
  const rs = b["reason"];

  if (typeof up === "number") out.unitPriceCents = up;
  if (typeof el === "boolean") out.billableEligible = el;
  if (typeof ba === "string" || ba === null) out.billedAt = ba ?? null;
  if (typeof rs === "string") out.reason = rs;
  return out;
}
