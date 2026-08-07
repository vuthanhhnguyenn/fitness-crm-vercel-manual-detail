'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EquipmentDetailSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-6 py-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3">
                <Skeleton className="size-20 rounded-full" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
