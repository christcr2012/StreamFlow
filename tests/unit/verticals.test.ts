import { verticalsRegistry, getForm, getPriceBook, estimate } from '../../packages/verticals/src/index';

export async function run() {
  const name = 'verticals';
  let passed = 0, failed = 0, total = 0;

  // Registry exposes expected keys
  total++;
  try {
    const keys = Object.keys(verticalsRegistry);
    if (keys.includes('cleaning') && keys.includes('roll-off') && keys.includes('port-a-john')) {
      passed++;
    } else {
      throw new Error('Missing expected vertical keys');
    }
  } catch (e) { failed++; }

  // Helper functions return objects without throwing
  total++;
  try {
    const form = getForm('cleaning', 'quote-form', 'org-1');
    const prices = getPriceBook('cleaning', 'org-1');
    const result = estimate('cleaning', { serviceType: 'residential', squareFeet: 1000 });
    if (form && prices && result && typeof result.total === 'number') {
      passed++;
    } else {
      throw new Error('Helpers did not return expected shapes');
    }
  } catch (e) { failed++; }

  return { name, passed, failed, total };
}

