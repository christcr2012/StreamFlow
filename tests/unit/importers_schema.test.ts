import { customerSchema, jobSchema, invoiceSchema } from '../../src/lib/import/schemas';

export async function run() {
  const name = 'importers_schema';
  let passed = 0, failed = 0, total = 0;

  // Customers: require company or primaryName
  total++;
  try {
    const res = customerSchema.safeParse({ primaryEmail: 'a@b.com' });
    if (!res.success) passed++; else failed++;
  } catch (e) { failed++; }

  // Customers: valid minimal
  total++;
  try {
    const res = customerSchema.safeParse({ primaryName: 'John Doe', primaryEmail: 'john@example.com' });
    if (!res.success) failed++; else passed++;
  } catch (e) { failed++; }

  // Jobs: missing title should fail
  total++;
  try {
    const res = jobSchema.safeParse({ description: 'x' });
    if (!res.success) passed++; else failed++;
  } catch (e) { failed++; }

  // Jobs: valid minimal
  total++;
  try {
    const res = jobSchema.safeParse({ title: 'Install water heater' });
    if (!res.success) failed++; else passed++;
  } catch (e) { failed++; }

  // Invoices: amount must be numeric
  total++;
  try {
    const res = invoiceSchema.safeParse({ amount: 'not-a-number' });
    if (!res.success) passed++; else failed++;
  } catch (e) { failed++; }

  // Invoices: valid minimal
  total++;
  try {
    const res = invoiceSchema.safeParse({ amount: '123.45', currency: 'USD' });
    if (!res.success) failed++; else passed++;
  } catch (e) { failed++; }

  return { name, passed, failed, total };
}

