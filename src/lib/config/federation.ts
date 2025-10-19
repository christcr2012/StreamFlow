// Federation configuration flags (canonical only)

function envBool(name: string, def: boolean): boolean {
  const v = process.env[name];
  if (v == null) return def;
  const s = String(v).trim().toLowerCase();
  return ['1','true','yes','on','y','t'].includes(s);
}

export const FED_ENABLED = envBool('FED_ENABLED', false);
export const FED_OIDC_ENABLED = envBool('FED_OIDC_ENABLED', false);
export const FED_RATE_LIMIT_ENABLED = envBool('FED_RATE_LIMIT_ENABLED', false);
export const FED_IDEMPOTENCY_ENABLED = envBool('FED_IDEMPOTENCY_ENABLED', false);
