import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function FieldSkeleton() {
  return (
    <div>
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function ExerciseDetailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-6 py-4">
        <Skeleton className="mb-2 h-4 w-40" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 w-80" />
            <Skeleton className="mt-2 h-5 w-24 rounded-full" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="size-9 rounded-md" />
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-0 pb-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <Card className="flex-1">
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-6 px-4">
              <div className="space-y-4">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                </div>
                <div className="space-y-4">
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-full space-y-4 lg:w-[40%]">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <Skeleton className="size-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent>
                <FieldSkeleton />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
