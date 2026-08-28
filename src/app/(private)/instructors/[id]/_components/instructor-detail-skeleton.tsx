import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InstructorDetailSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="border-b px-6 py-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex gap-6 px-6 py-4">
        <div className="min-w-0 flex-1 space-y-4">
          <Card>
            <CardContent className="space-y-3 px-4 py-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 px-4 py-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="w-[360px] shrink-0 space-y-4">
          <Card>
            <CardContent className="space-y-3 px-4 py-4">
              <Skeleton className="mx-auto h-20 w-20 rounded-full" />
              <Skeleton className="mx-auto h-4 w-20" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 px-4 py-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
