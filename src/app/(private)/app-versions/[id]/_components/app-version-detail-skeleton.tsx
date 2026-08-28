import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AppVersionDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-muted/40 border-b px-6 py-4">
        <div className="mb-2 flex items-center gap-1">
          <Skeleton className="size-3 rounded-sm" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-32" />
          <div className="flex min-h-8 items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="mb-1 h-3 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
              <div>
                <Skeleton className="mb-1 h-3 w-10" />
                <Skeleton className="h-4 w-full max-w-sm" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
