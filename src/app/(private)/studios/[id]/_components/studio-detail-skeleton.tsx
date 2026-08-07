import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StudioDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>

      <div className="flex gap-2 border-b">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <Card>
            <CardContent className="px-4">
              <Skeleton className="mb-4 h-4 w-20" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="mb-1 h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <Skeleton className="h-8 w-32" />
            <CardContent className="px-4">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-4">
              <Skeleton className="mb-4 h-4 w-24" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/2] w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-[360px] shrink-0 space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center px-4">
              <Skeleton className="mb-3 size-20 rounded-full" />
              <Skeleton className="mb-3 h-5 w-14 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-4">
              <Skeleton className="mb-3 h-4 w-16" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-4">
              <Skeleton className="mb-3 h-4 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
