import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AppVersionFormSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-muted/40 border-b px-6 py-4">
        <div className="mb-2 flex items-center gap-1">
          <Skeleton className="size-3 rounded-sm" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-48" />
        </div>
      </header>

      <div className="bg-background flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex max-w-240 flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 px-4">
              <div>
                <Skeleton className="mb-1 h-3 w-24" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
              <div>
                <Skeleton className="mb-1 h-3 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div>
                <Skeleton className="mb-1 h-3 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 border-t p-4">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
