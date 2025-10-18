// E2E smoke tests using Node fetch against a running server or deployed URL.
// Control expected behavior with environment variables:
//   BASE_URL (default http://localhost:5000)
//   E2E_EXPECT_FED_ENABLED ("true" or "false"): when "true", expect 401 unauth on protected routes
//   E2E_PROVIDER_COOKIE (optional): if provided, use for authenticated checks

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const EXP_FED = (process.env.E2E_EXPECT_FED_ENABLED || '').toLowerCase();
const TEST_PROVIDER_COOKIE = process.env.E2E_PROVIDER_COOKIE || '';

function expect(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function get(path: string, cookie?: string) {
  const res = await fetch(BASE_URL + path, { headers: cookie ? { Cookie: cookie } : {} });
  return res;
}

export async function run() {
  const name = 'e2e.federation.smoke';
  let passed = 0, failed = 0, total = 0;
  async function step(fn: () => Promise<void>, label: string) {
    total++;
    try { await fn(); passed++; console.log(`[PASS] ${label}`); } catch (e) { failed++; console.error(`[FAIL] ${label}:`, (e as Error).message); }
  }

  // Use existing provider-portal routes
  // 1) List federated clients (provider auth required)
  await step(async () => {
    const res = await get('/api/federation/clients');
    if (EXP_FED === 'true') expect(res.status === 401, `expected 401 without cookie when FED enabled, got ${res.status}`);
  }, 'federation/clients without cookie');

  if (TEST_PROVIDER_COOKIE) {
    await step(async () => {
      const res = await get('/api/federation/clients', TEST_PROVIDER_COOKIE);
      if (EXP_FED === 'true') {
        expect(res.status === 200, `expected 200 with provider cookie when FED enabled, got ${res.status}`);
        await res.json();
      }
    }, 'federation/clients with provider cookie');
  } else {
    console.log('[SKIP] federation/clients with provider cookie (no E2E_PROVIDER_COOKIE set)');
  }

  // 2) Federation keys (provider auth required)
  await step(async () => {
    const res = await get('/api/federation/keys');
    if (EXP_FED === 'true') expect(res.status === 401, `expected 401 without cookie when FED enabled, got ${res.status}`);
  }, 'federation/keys without cookie');

  if (TEST_PROVIDER_COOKIE) {
    await step(async () => {
      const res = await get('/api/federation/keys', TEST_PROVIDER_COOKIE);
      if (EXP_FED === 'true') {
        expect(res.status === 200, `expected 200 with provider cookie when FED enabled, got ${res.status}`);
        await res.json();
      }
    }, 'federation/keys with provider cookie');
  } else {
    console.log('[SKIP] federation/keys with provider cookie (no E2E_PROVIDER_COOKIE set)');
  }

  console.log(`[E2E SUMMARY] ${name}: ${passed}/${total} steps passed`);
  if (failed > 0) process.exit(1);
}

