import { Skeleton } from '@/components/ui/skeleton';

export function LessonHeaderSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-64" />
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function SpaceGridSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-md" />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
  );
}

export function ReservationListSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function ReservationStatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
