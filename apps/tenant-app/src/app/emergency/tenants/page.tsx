import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function TenantSelectionPage() {
  const store = await cookies();
  const provider = store.get('rs_provider');
  const developer = store.get('rs_developer');
  const isEmergency = store.get('rs_emergency')?.value === '1';

  if (!isEmergency || (!provider && !developer)) {
    redirect('/emergency/provider');
  }

  const orgs = await prisma.org.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { name: 'asc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Select Tenant</h1>
        <p className="text-sm text-gray-600">Choose the tenant to access (read-only by default). All actions are audited.</p>
      </div>

      <form method="POST" action="/api/emergency/select-tenant" className="space-y-3 rounded bg-white p-4 shadow">
        <label className="block text-sm font-medium text-gray-700">Tenant</label>
        <select name="tenantId" className="mt-1 w-full rounded border px-3 py-2" required>
          <option value="" disabled>Choose a tenantc</option>
          {orgs.map((o: any) => (
            <option key={o.id} value={o.id}>{o.name} 3 {o.id.substring(0,8)}</option>
          ))}
        </select>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Continue</button>
      </form>
    </div>
  );
}

