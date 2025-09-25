// src/lib/featureFlags.ts

/**
 * Helpers to safely consume featureFlags which is intentionally `unknown`.
 * These allow current UI code to treat flags like a key/value map
 * without committing the API to that shape forever.
 */

export function asObjectMap(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function getFlagBoolean(flags: unknown, key: string, def = false): boolean {
  const obj = asObjectMap(flags);
  const val = obj?.[key];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const t = val.trim().toLowerCase();
    if (["true", "1", "yes", "on", "enabled"].includes(t)) return true;
    if (["false", "0", "no", "off", "disabled"].includes(t)) return false;
  }
  return def;
}

export function getFlagString(flags: unknown, key: string, def = ""): string {
  const obj = asObjectMap(flags);
  const val = obj?.[key];
  return typeof val === "string" ? val : def;
}

export function getFlagNumber(flags: unknown, key: string, def = 0): number {
  const obj = asObjectMap(flags);
  const val = obj?.[key];
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : def;
  }
  return def;
}
