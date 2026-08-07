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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
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
