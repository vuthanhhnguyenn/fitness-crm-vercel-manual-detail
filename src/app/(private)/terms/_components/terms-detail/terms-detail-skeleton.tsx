import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TermsDetailSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="border-b px-6 py-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex gap-4 px-6 py-4">
        <div className="flex w-[60%] flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 px-4 py-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 px-4 py-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="w-[40%]">
          <Card>
            <CardContent className="flex flex-col gap-3 px-4 py-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
