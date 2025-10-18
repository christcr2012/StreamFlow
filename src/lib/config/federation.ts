// Federation configuration flags
// Canonical flags with legacy compatibility.

function envBool(name: string, def: boolean): boolean {
  const v = process.env[name];
  if (v == null) return def;
  const s = String(v).trim().toLowerCase();
  return ['1','true','yes','on','y','t'].includes(s);
}

function envBoolCompat(canonical: string, legacy: string | null, def: boolean): boolean {
  if (process.env[canonical] != null) return envBool(canonical, def);
  if (legacy && process.env[legacy] != null) {
    console.warn(`[deprecation] Using legacy env ${legacy}; prefer ${canonical}`);
    return envBool(legacy, def);
  }
  return def;
}

export const FED_ENABLED = envBoolCompat('FED_ENABLED', 'PROVIDER_FEDERATION_ENABLED', false);
export const FED_OIDC_ENABLED = envBoolCompat('FED_OIDC_ENABLED', 'PROVIDER_FEDERATION_OIDC_ENABLED', false);
export const FED_RATE_LIMIT_ENABLED = envBoolCompat('FED_RATE_LIMIT_ENABLED', 'PROVIDER_FEDERATION_RATE_LIMIT_ENABLED', false);
export const FED_IDEMPOTENCY_ENABLED = envBoolCompat('FED_IDEMPOTENCY_ENABLED', 'PROVIDER_FEDERATION_IDEMPOTENCY_ENABLED', false);
