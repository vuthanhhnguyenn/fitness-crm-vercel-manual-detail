import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InstructorFormSkeleton() {
  return (
    <div className="mx-auto max-w-240 space-y-6 px-6 py-4">
      <Card>
        <CardContent className="space-y-4 px-6 py-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 px-6 py-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
