import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function BusinessSettingsTabSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="w-full lg:w-3/5">
        <Card className="gap-4 py-4">
          <div className="px-4">
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="space-y-4 px-4 pt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, index) => (
                <div key={index} className="flex aspect-3/2 items-center justify-center">
                  <Skeleton className="size-6 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="w-full lg:w-2/5">
        <Card className="gap-4 py-4">
          <div className="border-b px-4 pb-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <div className="space-y-3 px-4 pt-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
