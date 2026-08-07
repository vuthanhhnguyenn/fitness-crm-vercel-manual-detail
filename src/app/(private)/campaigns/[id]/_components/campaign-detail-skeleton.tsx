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

export function CampaignDetailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-6 py-4">
        <Skeleton className="mb-2 h-4 w-40" />
        <Card className="mb-0 py-4">
          <CardContent className="flex flex-col gap-3 px-4 py-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-6 w-80" />
                <Skeleton className="mt-2 h-3 w-48" />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-6">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="flex flex-col gap-4 xl:w-[60%]">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="px-4 pt-0">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <div className="col-span-2">
                    <FieldSkeleton />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="px-4 pt-0">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="col-span-2">
                    <FieldSkeleton />
                  </div>
                  <FieldSkeleton />
                  <FieldSkeleton />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="px-4 pt-0">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="col-span-2">
                    <FieldSkeleton />
                  </div>
                  <FieldSkeleton />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:w-[40%]">
            <div className="flex flex-col gap-4">
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 px-4">
                  <Skeleton className="size-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <div className="flex flex-col gap-4">
                    <FieldSkeleton />
                    <FieldSkeleton />
                    <FieldSkeleton />
                    <FieldSkeleton />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
