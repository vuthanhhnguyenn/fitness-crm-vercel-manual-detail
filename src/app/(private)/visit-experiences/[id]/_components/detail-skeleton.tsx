import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        <CardSkeleton rows={6} />
        <CardSkeleton rows={2} />
        <CardSkeleton rows={3} />
        <CardSkeleton rows={4} />
      </div>
      <div className="flex w-full flex-col gap-4 lg:w-80">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Skeleton className="size-20 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
        <CardSkeleton rows={5} />
      </div>
    </div>
  );
}
