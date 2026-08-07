import { Skeleton } from '@/components/ui/skeleton';

export function LessonSchedulePageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      {/* KPI skeleton */}
      <LessonScheduleKpiSkeleton />
      {/* Timeline skeleton */}
      <LessonScheduleTimelineSkeleton />
    </div>
  );
}

export function LessonScheduleKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function LessonScheduleTimelineSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="mt-1 h-4 w-12 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LessonScheduleTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LessonScheduleWeeklyCalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1 rounded-lg border p-2">
      {Array.from({ length: 7 }).map((_, col) => (
        <div key={col} className="space-y-2">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 4 }).map((_, row) => (
            <Skeleton key={row} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AreaKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="mb-2 h-4 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}
