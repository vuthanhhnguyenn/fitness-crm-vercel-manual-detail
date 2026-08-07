import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function SectionHeaderSkeleton({ titleWidth = 'w-24' }: { titleWidth?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className={`h-4 ${titleWidth}`} />
    </div>
  );
}

function FieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function LessonFormSkeleton() {
  return (
    <main className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
      <div className="mx-auto max-w-[960px] space-y-6">
        {/* Edit warning alert */}
        <Skeleton className="h-12 w-full rounded-lg" />

        {/* 1. 基本情報 */}
        <Card>
          <CardContent className="px-6">
            <SectionHeaderSkeleton titleWidth="w-20" />
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton className="col-span-2" />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </CardContent>
        </Card>

        {/* 2. 予約制限 */}
        <Card>
          <CardContent className="px-6">
            <SectionHeaderSkeleton titleWidth="w-20" />
            <div className="grid grid-cols-2 gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </CardContent>
        </Card>

        {/* 3. レッスン画像 */}
        <Card>
          <CardContent className="px-6">
            <SectionHeaderSkeleton titleWidth="w-24" />
            <Skeleton className="h-[124px] w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* 4. レッスン内容説明 */}
        <Card>
          <CardContent className="px-6">
            <SectionHeaderSkeleton titleWidth="w-32" />
            <Skeleton className="mb-2 h-10 w-full rounded-lg" />
            <Skeleton className="h-[120px] w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* 5. 備考 */}
        <Card>
          <CardContent className="px-6">
            <SectionHeaderSkeleton titleWidth="w-16" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* ステータス */}
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

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </main>
  );
}
