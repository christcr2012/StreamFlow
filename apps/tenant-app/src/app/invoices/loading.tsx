import { TableSkeleton } from '@cortiware/ui';

export default function InvoicesLoading() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <TableSkeleton rows={10} columns={5} />
        </div>
      </div>
    </div>
  );
}

