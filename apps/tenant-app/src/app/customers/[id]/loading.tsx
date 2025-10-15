import { DetailSkeleton } from '@cortiware/ui';

export default function CustomerDetailLoading() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <DetailSkeleton />
      </div>
    </div>
  );
}

