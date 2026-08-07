import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StudioFormSkeleton() {
  return (
    <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
      <div className="mx-auto max-w-[1200px]">
        <Skeleton className="mb-6 h-12 w-full rounded-lg" />

        <div className="flex gap-6">
          <div className="min-w-0 flex-1 space-y-6">
            <Card>
              <CardContent className="px-4">
                <Skeleton className="mb-4 h-5 w-20" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-[120px]" />
                      <Skeleton className="h-3 w-4" />
                      <Skeleton className="h-10 w-[120px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-3 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4">
                <Skeleton className="mb-1 h-3 w-20" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4">
                <Skeleton className="mb-4 h-5 w-24" />
                <Skeleton className="h-[124px] w-full rounded-lg" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4">
                <Skeleton className="mb-1 h-3 w-12" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="px-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-[440px] shrink-0">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-7 flex-1 rounded-full" />
                    <Skeleton className="h-7 flex-1 rounded-full" />
                    <Skeleton className="h-7 flex-1 rounded-full" />
                    <Skeleton className="h-7 flex-1 rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square w-full rounded-md" />
                    ))}
                  </div>
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t p-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </main>
  );
}
