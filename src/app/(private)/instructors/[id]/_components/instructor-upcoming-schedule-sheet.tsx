'use client';

import Link from 'next/link';

import { CalendarDays, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

type UpcomingScheduleEntry = GetCrmInstructorsByIdResponse['upcoming_schedule']['entries'][number];
type RecurringSettingSummary =
  GetCrmInstructorsByIdResponse['upcoming_schedule']['recurring_summary'][number];

interface InstructorUpcomingScheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorName: string;
  entries: UpcomingScheduleEntry[];
  recurringSummary: RecurringSettingSummary[];
}

export function InstructorUpcomingScheduleSheet({
  open,
  onOpenChange,
  instructorName,
  entries,
  recurringSummary,
}: InstructorUpcomingScheduleSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-120 flex-col gap-0 overflow-hidden p-0 sm:max-w-120">
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4" />
              {instructorName} のスケジュール
              <Badge variant="destructive" className="text-[10px]">
                {entries.length}件
              </Badge>
            </SheetTitle>
            <SheetDescription className="sr-only">全{entries.length}件の担当予定</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {recurringSummary.length > 0 && (
            <>
              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground text-xs font-semibold">繰り返し設定</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {recurringSummary.length}件
                  </Badge>
                </div>
                {recurringSummary.map((setting, i) => (
                  <div key={i} className="bg-muted/50 space-y-2 rounded-lg border p-3">
                    <Badge variant="outline" className="px-2 text-[10px] font-medium">
                      {setting.pattern_text}
                    </Badge>
                    <p className="text-muted-foreground text-xs">
                      有効件数: {setting.active_count}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="-mx-6 w-[calc(100%+48px)]" />
            </>
          )}

          <div className="py-4">
            <p className="text-foreground mb-3 text-xs font-semibold">個別スケジュール一覧</p>
            {entries.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                スケジュールはありません
              </p>
            ) : (
              <div className="divide-y">
                {entries.map((entry) => (
                  <Link
                    key={entry.schedule_id}
                    href={navigate('/lesson-schedules/[id]/reservations', entry.schedule_id)}
                    className="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors"
                  >
                    <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{entry.date}</p>
                      <p className="text-muted-foreground text-xs">
                        {entry.lesson_name} · {entry.time}
                        {entry.studio_name && ` · ${entry.studio_name}`}
                        {entry.is_recurring && ' · 繰り返し'}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {entry.booked_count}/{entry.capacity}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 border-t px-6 py-4">
          <Link href={navigate('/lesson-schedules/create')}>
            <Button type="button" className="h-9 w-full text-sm">
              <Plus className="mr-2 size-4" />
              スケジュールを追加
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
