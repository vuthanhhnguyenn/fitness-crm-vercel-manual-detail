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

export function ArticleCategoryFormSkeleton() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white backdrop-blur-sm">
        <div className="bg-muted/40 px-6 py-4">
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-6 w-32" />
        </div>
      </header>

      <div className="bg-background flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex max-w-240 flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 px-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 border-t p-4">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      </div>
    </>
  );
}
