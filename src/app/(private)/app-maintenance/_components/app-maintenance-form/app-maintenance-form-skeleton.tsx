import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AppMaintenanceFormSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
      <div className="mx-auto flex max-w-[960px] flex-col gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-4">
            {/* 対象ブランド */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex items-center gap-6">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>

            {/* 開始日時 / 終了日時 */}
            <div className="grid grid-cols-2 items-start gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* メンテナンスメッセージ */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>

            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}
