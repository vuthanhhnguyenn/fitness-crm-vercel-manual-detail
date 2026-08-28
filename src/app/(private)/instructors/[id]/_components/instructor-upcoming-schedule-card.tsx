'use client';

import { useState } from 'react';

import Link from 'next/link';

import { CalendarDays } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { InstructorUpcomingScheduleSheet } from './instructor-upcoming-schedule-sheet';

type UpcomingScheduleEntry = GetCrmInstructorsByIdResponse['upcoming_schedule']['entries'][number];
type RecurringSettingSummary =
  GetCrmInstructorsByIdResponse['upcoming_schedule']['recurring_summary'][number];

interface InstructorUpcomingScheduleCardProps {
  instructorName: string;
  entries: UpcomingScheduleEntry[];
  recurringSummary: RecurringSettingSummary[];
}

export function InstructorUpcomingScheduleCard({
  instructorName,
  entries,
  recurringSummary,
}: InstructorUpcomingScheduleCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // TODO: `entries` is not filtered by date, so past schedules are shown here too.
  // Waiting on spec for the definition of "upcoming" before adding a date filter.
  const inlineEntries = entries.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">直近のスケジュール</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            全{entries.length}件
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {entries.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            予定されたスケジュールはありません
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {inlineEntries.map((entry) => (
                <Link
                  key={entry.schedule_id}
                  href={navigate('/lesson-schedules/[id]/reservations', entry.schedule_id)}
                  className="block"
                >
                  <div className="bg-muted/50 hover:bg-muted cursor-pointer rounded-lg p-3 transition-colors">
                    <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {entry.date} {entry.time}
                      </p>
                      <p className="text-muted-foreground text-xs">{entry.lesson_name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-8 w-full text-xs"
              onClick={() => setSheetOpen(true)}
            >
              全{entries.length}件を表示
            </Button>
          </>
        )}
      </CardContent>

      <InstructorUpcomingScheduleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        instructorName={instructorName}
        entries={entries}
        recurringSummary={recurringSummary}
      />
    </Card>
  );
}
