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
        {/* Left column — companion banner (conditional) / applicant / blacklist /
            contract / fee (incl. checklist rows) / timeline */}
        <div className="flex w-[60%] flex-col gap-4">
          {[90, 120, 80, 140, 220, 200].map((h, i) => (
            <Card key={`left-${i}-${h}`}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full" style={{ height: h }} />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Right column — status/checklist/actions card, meta card */}
        <div className="flex w-[40%] flex-col gap-4">
          {[320, 120].map((h, i) => (
            <Card key={`right-${i}-${h}`}>
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
