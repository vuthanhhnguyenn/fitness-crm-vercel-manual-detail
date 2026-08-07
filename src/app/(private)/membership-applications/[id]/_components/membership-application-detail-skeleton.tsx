import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MembershipApplicationDetailSkeleton() {
  return (
    <div className="bg-muted/40 p-6">
      {/* Page Header skeleton */}
      <div className="bg-muted/40 sticky z-10 -mx-6 mb-4 border-b px-6 pt-2 pb-3 backdrop-blur-sm">
        <Skeleton className="mb-2 h-4 w-32" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="size-8" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left column */}
        <div className="flex w-[60%] flex-col gap-4">
          {[120, 80, 140, 160, 200].map((h) => (
            <Card key={h}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full" style={{ height: h }} />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Right column */}
        <div className="flex w-[40%] flex-col gap-4">
          {[240, 120].map((h) => (
            <Card key={h}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full" style={{ height: h }} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
