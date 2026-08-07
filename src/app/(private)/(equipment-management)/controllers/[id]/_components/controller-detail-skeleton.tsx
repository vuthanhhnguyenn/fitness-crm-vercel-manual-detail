'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ControllerDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
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
  );
}
