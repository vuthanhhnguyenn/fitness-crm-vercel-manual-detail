'use client';

import { useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Bell, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmLessonSchedulesOptions,
  getCrmLessonSchedulesQueryKey,
  getCrmLessonSchedulesStoresSummaryQueryKey,
  getCrmLessonSchedulesSummaryQueryKey,
  postCrmLessonSchedulesByIdChangeMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem } from '@/lib/api/types.gen';

import { useLessonScheduleFiltersContext } from '../_contexts/lesson-schedule-filters-context';
import { formatTimeRange, getLessonTypeLabel, toTimeSlot } from './lesson-schedule-display.util';

const NO_CHANGE = 'no-change';

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}月${d.getDate()}日(${dayNames[d.getDay()]})`;
}

interface ScheduleChangeModalProps {
  open: boolean;
  schedule: LessonScheduleListItem | null;
  onOpenChange: (open: boolean) => void;
}

interface ScheduleChangeModalContentProps {
  schedule: LessonScheduleListItem;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleChangeModal({ open, schedule, onOpenChange }: ScheduleChangeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {schedule && open && (
        <ScheduleChangeModalContent
          key={schedule.id}
          schedule={schedule}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  );
}

function ScheduleChangeModalContent({ schedule, onOpenChange }: ScheduleChangeModalContentProps) {
  const queryClient = useQueryClient();
  const { schedulesQueryParams } = useLessonScheduleFiltersContext();

  const originalStart = toTimeSlot(schedule.start_time);
  const originalEnd = toTimeSlot(schedule.end_time);

  const [changeScope, setChangeScope] = useState<'this-only' | 'all-after'>('this-only');
  const [sendNotification, setSendNotification] = useState(true);
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState(originalStart);
  const [endTime, setEndTime] = useState(originalEnd);
  const [instructorId, setInstructorId] = useState(NO_CHANGE);
  const [studioName, setStudioName] = useState(schedule.studio_name ?? '');

  const schedulesQuery = useQuery({
    ...getCrmLessonSchedulesOptions({ query: schedulesQueryParams }),
  });

  const instructorOptions = useMemo(() => {
    const schedules = schedulesQuery.data?.schedules ?? [];
    return Array.from(
      new Map(
        schedules.map((s) => [s.instructor_id, { id: s.instructor_id, name: s.instructor_name }]),
      ).values(),
    ).filter((i) => i.id !== schedule.instructor_id);
  }, [schedulesQuery.data?.schedules, schedule.instructor_id]);

  const isTimeRangeValid = startTime < endTime;

  const changeMutation = useMutation({
    ...postCrmLessonSchedulesByIdChangeMutation(),
    onSuccess: () => {
      toast.success('スケジュールを変更しました');
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesStoresSummaryQueryKey() });
      onOpenChange(false);
    },
  });

  function handleConfirm() {
    if (!reason.trim() || !isTimeRangeValid) return;

    changeMutation.mutate({
      path: { id: schedule.id },
      body: {
        reason: reason.trim(),
        new_start_time: startTime !== originalStart ? startTime : undefined,
        new_end_time: endTime !== originalEnd ? endTime : undefined,
        new_instructor_id: instructorId !== NO_CHANGE ? instructorId : undefined,
      },
    });
  }

  const lessonTypeLabel = getLessonTypeLabel(schedule.lesson_type);
  const timeRange = formatTimeRange(schedule.start_time, schedule.end_time);
  const dateLabel = formatDateLabel(schedule.start_time);
  const isPending = changeMutation.isPending;

  return (
    <DialogContent className="flex max-h-[760px] w-full max-w-[640px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
      <DialogHeader className="shrink-0 border-b px-6 py-4">
        <DialogTitle>レッスンスケジュール変更</DialogTitle>
        <DialogDescription>予約が存在するレッスンの変更には制限があります</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="bg-primary/5 mb-5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">{schedule.lesson_name}</p>
              <p className="text-muted-foreground text-xs">
                {dateLabel} {timeRange}
                {schedule.studio_name ? ` | ${schedule.studio_name}` : ''}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary text-[10px]"
              >
                {lessonTypeLabel}レッスン
              </Badge>
              {schedule.booked_count > 0 && (
                <div className="mt-1 flex items-center justify-end gap-1">
                  <AlertTriangle className="text-warning size-3" />
                  <span className="text-warning text-[10px] font-medium">
                    予約あり: {schedule.booked_count}名
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs font-bold">変更範囲</p>
          <RadioGroup
            value={changeScope}
            onValueChange={(v) => setChangeScope(v as 'this-only' | 'all-after')}
            className="grid grid-cols-2 gap-2"
          >
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                changeScope === 'this-only' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="this-only" className="shrink-0" />
              <div>
                <p className="text-xs font-medium">この回のみ変更</p>
                <p className="text-muted-foreground text-[10px]">{dateLabel}のみ</p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                changeScope === 'all-after' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="all-after" className="shrink-0" />
              <div>
                <p className="text-xs font-medium">以降すべて変更</p>
                <p className="text-muted-foreground text-[10px]">{dateLabel}以降</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-bold">開始・終了時間</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-xs font-medium">開始時刻</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs font-medium">終了時刻</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {!isTimeRangeValid && (
              <p className="text-destructive mt-1 text-[10px]">
                終了時間は開始時間より後にしてください
              </p>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-bold">インストラクター</p>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2">
                <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                  {schedule.instructor_name.charAt(0)}
                </div>
                <span className="text-sm">{schedule.instructor_name}</span>
                <span className="text-muted-foreground ml-auto text-[10px]">現在の担当</span>
              </div>
              <ArrowRight className="text-muted-foreground size-5 shrink-0" />
              <Select value={instructorId} onValueChange={(v) => v && setInstructorId(v)}>
                <SelectTrigger className="h-9 flex-1 text-sm">
                  <SelectValue>
                    {instructorId === NO_CHANGE
                      ? '変更なし'
                      : (instructorOptions.find((i) => i.id === instructorId)?.name ??
                        schedule.instructor_name)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANGE}>変更なし</SelectItem>
                  {instructorOptions.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {schedule.studio_name && (
            <div>
              <p className="mb-1 text-xs font-bold">スタジオ</p>
              <Select value={studioName} onValueChange={(v) => v && setStudioName(v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue>{studioName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={schedule.studio_name}>{schedule.studio_name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-bold">
              変更理由 <span className="text-destructive">*</span>
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="変更理由を入力してください(例: インストラクター体調不良のため代行)"
              className="resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        <div className="border-border bg-muted/50 mt-5 rounded-lg border p-4">
          <h4 className="mb-2 text-xs font-bold">変更の影響</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Info className="text-info size-4" />
              <span className="text-muted-foreground">
                影響を受ける予約:{' '}
                <strong className="text-foreground">{schedule.booked_count}件</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="text-warning size-4" />
              <span className="text-muted-foreground">
                予約者への通知:{' '}
                <strong className="text-foreground">スケジュール変更のお知らせ</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-success size-4" />
              <span className="text-muted-foreground">
                返金処理: <strong className="text-foreground">不要</strong>
                （レッスン自体は実施）
              </span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="shrink-0 flex-col gap-2 px-10 pb-8 sm:flex-col sm:justify-between">
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <div className="flex items-center gap-3">
            <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox
                checked={sendNotification}
                onCheckedChange={(v) => setSendNotification(!!v)}
              />
              予約者に変更通知を送信
            </label>
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={isPending || !reason.trim() || !isTimeRangeValid}
            >
              {isPending ? '変更中...' : '変更を確定'}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground w-full text-right text-[10px]">
          確定後、スケジュール画面に戻ります
        </p>
      </DialogFooter>
    </DialogContent>
  );
}
