import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton({
  titleWidth = 'w-32',
  rows = 2,
}: {
  readonly titleWidth?: string;
  readonly rows?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className={`h-5 ${titleWidth}`} />
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className={index === rows - 1 ? 'h-24 w-full' : 'h-10 w-full'} />
        ))}
      </CardContent>
    </Card>
  );
}

export function ManualNotificationFormSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-6 py-4">
      <SectionSkeleton titleWidth="w-24" rows={1} />
      <SectionSkeleton titleWidth="w-40" rows={2} />
      <SectionSkeleton titleWidth="w-32" rows={2} />
      <SectionSkeleton titleWidth="w-40" rows={3} />
      <SectionSkeleton titleWidth="w-32" rows={2} />
      <div className="flex justify-end gap-2 border-t p-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
