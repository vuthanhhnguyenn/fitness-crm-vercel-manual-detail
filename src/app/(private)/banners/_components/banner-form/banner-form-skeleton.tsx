import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function FieldSkeleton() {
  return (
    <div>
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function BannerFormSkeleton() {
  return (
    <>
      <div className="bg-background flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex max-w-240 flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 px-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="px-4">
              <Skeleton className="mb-3 h-9 w-40 rounded-md" />
              <Skeleton className="h-50 w-full max-w-150 rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-28" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-4">
              <Skeleton className="h-18 w-full rounded-lg" />
              <Skeleton className="h-18 w-full rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 px-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-16" />
            </CardHeader>
            <CardContent className="px-4">
              <Skeleton className="h-9 w-30" />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 border-t p-4">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </>
  );
}
