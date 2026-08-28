import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function BillingDetailSkeleton() {
  return (
    <div className="px-6 py-4">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="w-[360px] shrink-0 space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <Skeleton className="mx-auto size-20 rounded-full" />
              <Skeleton className="mx-auto h-5 w-20" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
