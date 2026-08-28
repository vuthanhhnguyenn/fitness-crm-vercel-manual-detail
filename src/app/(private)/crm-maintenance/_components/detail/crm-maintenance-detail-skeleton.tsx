import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CrmMaintenanceDetailSkeleton() {
  return (
    <div className="flex gap-4 px-6 py-4">
      <div className="flex w-[60%] flex-col gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 px-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="px-4">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2 px-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="flex w-[40%] flex-col gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 px-4">
            <Skeleton className="size-20 rounded-full" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
