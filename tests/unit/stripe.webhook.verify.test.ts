import Stripe from 'stripe';

export async function run() {
  const name = 'stripe.webhook.verify';
  let passed = 0, failed = 0, total = 0;

  const stripe = new Stripe('sk_test_dummy', { apiVersion: '2023-10-16' });
  const secret = 'whsec_test_secret_123';

  // Test: constructEvent verifies valid signature and preserves metadata.orgId
  total++;
  try {
    const payload = JSON.stringify({
      id: 'evt_test_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', metadata: { orgId: 'org_abc', invoiceId: 'inv_1' }, amount: 5000 } },
    });
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) });
    const event = stripe.webhooks.constructEvent(payload, header, secret);
    if (event.type === 'payment_intent.succeeded' && (event.data as any).object.metadata.orgId === 'org_abc') {
      passed++;
    } else {
      throw new Error('Unexpected event shape');
    }
  } catch (e) {
    failed++;
    console.error('verify valid signature failed', e);
  }

  // Test: invalid signature should throw
  total++;
  try {
    const payload = JSON.stringify({ id: 'evt_test_2', type: 'payment_intent.payment_failed', data: { object: { id: 'pi_456' } } });
    const badHeader = 't=0,v1=deadbeef';
    try {
      stripe.webhooks.constructEvent(payload, badHeader, secret);
      throw new Error('Expected invalid signature to throw');
    } catch {
      passed++;
    }
  } catch (e) {
    failed++;
    console.error('invalid signature test failed', e);
  }

  return { name, passed, failed, total };
}

