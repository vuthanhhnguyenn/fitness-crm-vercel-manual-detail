'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LockerDetailSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-6 py-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="w-80 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
