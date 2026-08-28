import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CrmMaintenanceFormSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-6 py-4">
      <Card>
        <CardContent className="space-y-4 px-6 py-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 px-6 py-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
