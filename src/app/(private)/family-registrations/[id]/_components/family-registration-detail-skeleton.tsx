'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FamilyRegistrationDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col pb-[70px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        <Skeleton className="h-5 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        {/* Basic Info Card */}
        <Card className="py-0">
          <CardContent className="p-4">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 flex gap-4">
              {/* Avatar */}
              <Skeleton className="size-16 shrink-0 rounded-full" />
              {/* Info */}
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="h-3.5 w-48" />
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-44" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex flex-1 flex-col">
          {/* Tab list */}
          <div className="flex gap-1 border-b pb-0">
            {[80, 72, 72, 64].map((w, i) => (
              <Skeleton key={i} className="mb-2 h-8 rounded-md" style={{ width: w }} />
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-4 space-y-3">
            <Card className="py-0">
              <CardContent className="p-4">
                <Skeleton className="mb-4 h-4 w-28" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="p-4">
                <Skeleton className="mb-4 h-4 w-28" />
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-background fixed right-0 bottom-0 left-0 border-t">
        <div className="mx-auto flex items-center justify-end gap-2 p-3">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}
