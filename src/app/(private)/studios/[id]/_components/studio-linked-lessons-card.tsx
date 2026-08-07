'use client';

import { useRouter } from 'next/navigation';

import type { LinkedLessonSummary } from '@/app/api/_schemas/studio-detail.schema';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { navigate } from '@/lib/routes/routes.util';

interface StudioLinkedLessonsCardProps {
  lessons: LinkedLessonSummary[];
}

export function StudioLinkedLessonsCard({ lessons }: StudioLinkedLessonsCardProps) {
  const router = useRouter();

  if (!lessons || lessons.length === 0) {
    return (
      <Card>
        <CardContent className="px-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">紐付きレッスン</h3>
          </div>
          <p className="text-muted-foreground text-center text-xs">
            リンクされたレッスンはありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="px-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">紐付きレッスン</h3>
          <Badge variant="secondary" className="text-[10px]">
            {lessons.length}件
          </Badge>
        </div>
        <div className="space-y-1">
          {lessons.map((lesson) => (
            <div
              key={lesson.lesson_id}
              className="hover:bg-accent/50 -mx-1 flex cursor-pointer items-center justify-between rounded border-b px-1 py-2 last:border-b-0"
              onClick={() => router.push(navigate('/lessons/[id]', lesson.lesson_id))}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{lesson.lesson_name}</p>
                  <Badge
                    variant="outline"
                    className="bg-info/10 text-info border-info/20 shrink-0 text-[10px]"
                  >
                    {lesson.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">{lesson.schedule_text}</p>
              </div>
              <span
                className={`ml-2 shrink-0 text-xs font-medium ${
                  lesson.reservation_rate >= 80
                    ? 'text-success'
                    : lesson.reservation_rate >= 60
                      ? 'text-warning'
                      : 'text-muted-foreground'
                }`}
              >
                {lesson.reservation_rate}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
