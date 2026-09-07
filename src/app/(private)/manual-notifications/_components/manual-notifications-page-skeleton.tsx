import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ManualNotificationsPageSkeleton() {
  return (
    <div>
      <PageHeader
        title="手動配信通知"
        className="bg-white"
        badge={<Skeleton className="h-5 w-12 rounded-full" />}
        actions={<Skeleton className="h-8 w-24 rounded-lg" />}
      />

      <div className="bg-background px-6 py-4">
        <Card className="gap-0 overflow-hidden rounded-xl border p-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="border-t">
            <div className="bg-muted/50 grid grid-cols-6 gap-4 border-b px-4 py-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
            {Array.from({ length: 8 }, (_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-6 gap-4 border-b px-4 py-3 last:border-0"
              >
                {Array.from({ length: 6 }, (_, cellIndex) => (
                  <Skeleton key={cellIndex} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
