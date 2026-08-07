import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LeaveDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-5 w-48" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>

      <div className="flex gap-4">
        <div className="flex w-[60%] flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="px-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="mb-1 h-3 w-16" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="w-[40%]">
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
