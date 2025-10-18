export async function run() {
  const name = 'federation.flags.compat';
  let passed = 0, failed = 0, total = 0;
  function assert(cond: any, msg: string) {
    total++; if (cond) passed++; else { failed++; console.error(`[FAIL] ${name}: ${msg}`); }
  }

  // Snapshot current env to restore after
  const snap: Record<string,string|undefined> = {
    FED_ENABLED: process.env.FED_ENABLED,
    PROVIDER_FEDERATION_ENABLED: process.env.PROVIDER_FEDERATION_ENABLED,
  };

  try {
    const { verifyFederation } = await import('../../src/lib/providerFederationVerify');

    // Default: disabled
    delete process.env.FED_ENABLED;
    delete process.env.PROVIDER_FEDERATION_ENABLED;
    let r = await verifyFederation({});
    assert(r.ok === false && r.reason === 'disabled', 'default disabled when no flags set');

    // Legacy enables when canonical absent
    delete process.env.FED_ENABLED;
    process.env.PROVIDER_FEDERATION_ENABLED = '1';
    r = await verifyFederation({});
    assert(r.ok === false && r.reason === 'missing headers', 'legacy flag enables verifier path');

    // Canonical overrides legacy off
    process.env.FED_ENABLED = 'true';
    process.env.PROVIDER_FEDERATION_ENABLED = '0';
    r = await verifyFederation({});
    assert(r.ok === false && r.reason === 'missing headers', 'canonical flag enables verifier path');
  } catch (e) {
    failed++;
    console.error('[EXCEPTION]', e);
  } finally {
    // restore
    for (const k of Object.keys(snap)) {
      const v = (snap as any)[k];
      if (v == null) delete (process.env as any)[k];
      else (process.env as any)[k] = v;
    }
  }

  return { name, passed, failed, total };
}

