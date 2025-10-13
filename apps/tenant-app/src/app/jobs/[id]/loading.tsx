import { DetailSkeleton } from '@/components/ui/skeleton';

export default function JobDetailLoading() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <DetailSkeleton />
      </div>
    </div>
  );
}

