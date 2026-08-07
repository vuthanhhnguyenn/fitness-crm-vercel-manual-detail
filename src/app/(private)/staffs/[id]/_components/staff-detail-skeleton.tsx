'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StaffDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Header (name + tag + actions) */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-56" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
