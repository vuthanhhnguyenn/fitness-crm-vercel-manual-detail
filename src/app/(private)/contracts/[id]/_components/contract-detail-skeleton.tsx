'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ContractDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      {/* PageHeader breadcrumb */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* PageHeader title + badge + actions */}
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4">
        <div className="flex gap-2 border-b pb-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        <div className="mt-4 flex gap-4">
          {/* Left column */}
          <div className="flex w-[60%] flex-col gap-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex w-[40%] flex-col gap-4">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
