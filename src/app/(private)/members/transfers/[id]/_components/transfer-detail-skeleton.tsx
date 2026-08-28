import { Skeleton } from '@/components/ui/skeleton';

export function TransferDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Breadcrumb skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* MemberHeadupCard skeleton */}
      <div className="flex items-center gap-4 rounded-lg border px-4 py-4">
        <Skeleton className="size-24 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-5 w-40 rounded-full" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Main content layout */}
      <div className="flex gap-4">
        {/* Left column — 60% */}
        <div className="flex w-[60%] flex-col gap-4">
          {/* TransferDetailInfo skeleton */}
          <div className="space-y-4 rounded-lg border p-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* TransferApprovalFlow skeleton */}
          <div className="space-y-4 rounded-lg border p-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>

        {/* Right column — 40% */}
        <div className="w-[40%]">
          <div className="space-y-4 rounded-lg border p-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
