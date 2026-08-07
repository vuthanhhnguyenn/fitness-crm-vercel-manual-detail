import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton mirroring the detail header + two-column card layout (FR-003-P1-22).
 */
export function LessonDetailSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="bg-muted/40 border-b px-6 py-4">
        <Skeleton className="mb-2 h-3 w-32" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <Skeleton className="mb-4 h-9 w-48" />
        <div className="flex gap-6">
          {/* Left column */}
          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="aspect-[3/2] w-full rounded-lg" />
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="w-[360px] shrink-0 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
