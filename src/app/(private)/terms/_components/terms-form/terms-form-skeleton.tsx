import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TermsFormSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="bg-muted/40 border-b px-6 py-4">
        <div className="mb-2 flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="mx-auto flex w-full max-w-240 flex-col gap-6 px-6 py-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-40" />
              <div className="grid max-w-100 grid-cols-2 gap-4">
                {['brand-1', 'brand-2', 'brand-3', 'brand-4'].map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-sm" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-48" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-40" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-40" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 w-20" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-12" />
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="h-20 w-full max-w-160" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-40" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}
