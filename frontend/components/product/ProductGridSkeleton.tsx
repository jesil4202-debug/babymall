'use client';

interface ProductGridSkeletonProps {
  count?: number;
  list?: boolean;
}

export default function ProductGridSkeleton({ count = 8, list = false }: ProductGridSkeletonProps) {
  if (list) {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="p-4 flex gap-4">
              <div className="skeleton w-24 h-24 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 rounded w-1/3" />
                <div className="skeleton h-4 rounded w-2/3" />
                <div className="skeleton h-4 rounded w-1/2" />
                <div className="skeleton h-5 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden">
          <div className="skeleton aspect-square" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-3 rounded w-3/4" />
            <div className="skeleton h-4 rounded w-1/2" />
            <div className="skeleton h-5 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

