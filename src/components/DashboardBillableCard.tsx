// src/components/DashboardBillableCard.tsx (NEW)
import useSWR from 'swr';

const fetcher = (u:string)=> fetch(u).then(r=>r.json());

export default function DashboardBillableCard(){
  const { data } = useSWR('/api/dashboard/summary', fetcher, { refreshInterval: 30_000 });
  const count = data?.monthBillableCount ?? 0;
  const unit = (data?.unitPriceCents ?? 10000) / 100;
  const total = (data?.monthBillableAmountCents ?? 0) / 100;
  const unbilled = data?.monthUnbilledCount ?? 0;

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="text-sm text-gray-500">Conversion‑Based Billing</div>
      <div className="mt-1 text-xl font-semibold">This Month: {count} converted (billable)</div>
      <div className="mt-1 text-sm text-gray-600">Invoice draft preview: {count} × ${unit.toFixed(0)} = ${total.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
      {unbilled > 0 && (
        <div className="mt-1 text-xs text-amber-700">Unbilled so far: {unbilled} lead(s)</div>
      )}
    </div>
  );
}
