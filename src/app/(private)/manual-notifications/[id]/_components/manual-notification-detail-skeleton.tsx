import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function FieldSkeleton({ className }: { readonly className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-5 w-full" />
    </div>
  );
}

export function ManualNotificationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-6 lg:w-[60%]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <FieldSkeleton />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>

      <aside className="w-full lg:w-[40%]">
        <div className="flex flex-col gap-6 lg:sticky lg:top-0">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}
