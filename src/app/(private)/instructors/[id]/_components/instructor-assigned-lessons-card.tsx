'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

type AssignedLessonSummary = GetCrmInstructorsByIdResponse['assigned_lessons'][number];

const WEEKDAY_LABELS: Record<string, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
};

function reservationRateClass(rate: number) {
  if (rate >= 80) return 'text-success';
  if (rate >= 60) return 'text-warning';
  return 'text-muted-foreground';
}

export function InstructorAssignedLessonsCard({ lessons }: { lessons: AssignedLessonSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">担当レッスン</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            全{lessons.length}件
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {lessons.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">担当レッスンはありません</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <Link
                key={lesson.lesson_id}
                href={navigate('/lesson-schedules/[id]/reservations', lesson.lesson_id)}
                className="block"
              >
                <div className="bg-muted/50 hover:bg-muted cursor-pointer rounded-lg p-3 transition-colors">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{lesson.lesson_name}</p>
                    <span
                      className={`ml-2 shrink-0 text-xs font-medium tabular-nums ${reservationRateClass(lesson.reservation_rate)}`}
                    >
                      {lesson.reservation_rate}%
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <div className="flex gap-1">
                      {lesson.weekdays.map((day) => (
                        <span
                          key={day}
                          className="bg-background text-foreground rounded border px-2 py-0.5 text-[10px]"
                        >
                          {WEEKDAY_LABELS[day] ?? day}
                        </span>
                      ))}
                    </div>
                    <span>·</span>
                    <span>{lesson.time}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
