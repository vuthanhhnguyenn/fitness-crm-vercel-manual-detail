import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function CardSkeleton({ rows = 4, compact = false }: { rows?: number; compact?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-x-8 gap-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            {!compact && <Skeleton className="h-4 w-28" />}
            {!compact && <Skeleton className="h-4 w-24" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-4">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

/**
 * The back link and the heading are **not** skeletoned: `PageHeader` renders both for
 * real while the body loads, so repeating them here would stack a placeholder under a
 * live header.
 */
export function BlacklistDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Member head-up card */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <Skeleton className="size-24 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-56" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {/* Left column — 60%. Two cards: 登録情報 と 未納金 (照合条件 is not built, Q-02). */}
        <div className="flex w-[60%] flex-col gap-4">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={1} compact />
        </div>

        {/* Right column — 40% */}
        <div className="w-[40%]">
          <StatusCardSkeleton />
        </div>
      </div>
    </div>
  );
}
