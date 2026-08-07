'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LockerContractDetailSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-6 py-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-4">
          <div className="flex w-[60%] flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 px-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="w-[40%] space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 px-4">
                <Skeleton className="size-20 rounded-full" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-4 px-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
