'use client';

import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { toSelectItems } from '@/utils/app.util';
import { formatISODateLocal } from '@/utils/date.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmLessonSchedulesManualReservationMembersOptions,
  getCrmLessonSchedulesOptions,
  getCrmLessonSchedulesQueryKey,
  getCrmLessonSchedulesSummaryQueryKey,
  postCrmLessonSchedulesManualReservationMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type ManualReservationFormValues,
  manualReservationFormSchema,
} from '../_schemas/manual-reservation-form.schema';
import { formatTimeRange } from '../_utils/lesson-schedule-display.util';

type ManualReservationCourse = 'monthly' | 'single_30' | 'single_60';

const COURSE_OPTIONS: { value: ManualReservationCourse; label: string }[] = [
  { value: 'monthly', label: '月次プラン' },
  { value: 'single_30', label: '都度30分' },
  { value: 'single_60', label: '都度60分' },
];
const COURSE_ITEMS = toSelectItems(COURSE_OPTIONS);

const DEFAULT_VALUES: ManualReservationFormValues = {
  memberId: '',
  scheduleId: '',
  course: '',
  note: '',
};

interface ManualReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualReservationModal({ open, onOpenChange }: ManualReservationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <ManualReservationModalContent onOpenChange={onOpenChange} />}
    </Dialog>
  );
}

function ManualReservationModalContent({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const today = formatISODateLocal(new Date());

  const form = useForm<ManualReservationFormValues>({
    resolver: zodResolver(manualReservationFormSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const memberId = useWatch({ control: form.control, name: 'memberId' });

  const membersQuery = useQuery({
    ...getCrmLessonSchedulesManualReservationMembersOptions(),
  });
  const slotsQuery = useQuery({
    ...getCrmLessonSchedulesOptions({ query: { date: today, axis: 'store' } }),
  });

  const members = membersQuery.data?.members ?? [];
  const selectedMember = members.find((m) => m.member_id === memberId) ?? null;
  const slots = (slotsQuery.data?.schedules ?? []).filter((s) => s.booked_count < s.capacity);

  const memberItems = toSelectItems(
    members.map((m) => ({ value: m.member_id, label: buildMemberLabel(m) })),
  );
  const scheduleItems = toSelectItems(
    slots.map((s) => ({ value: s.id, label: buildScheduleLabel(s) })),
  );

  const blockReason = useMemo(() => {
    if (!selectedMember) return null;
    if (selectedMember.plan === 'monthly' && selectedMember.remaining === 0) {
      return '残回数が不足しています';
    }
    if (selectedMember.penalty_until && today <= formatISODateLocal(selectedMember.penalty_until)) {
      return `予約不可期間中の会員です（${selectedMember.penalty_until}まで）`;
    }
    return null;
  }, [selectedMember, today]);
  const isBlocked = blockReason !== null;
  const canSubmit = form.formState.isValid && !isBlocked;

  const mutation = useMutation({
    ...postCrmLessonSchedulesManualReservationMutation(),
    onSuccess: (data) => {
      toast.success(data.message, { description: data.description });
      queryClient.invalidateQueries({
        queryKey: getCrmLessonSchedulesQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmLessonSchedulesSummaryQueryKey(),
      });
      handleClose();
    },
    onError: () => {
      toast.error('予約の登録に失敗しました');
    },
  });

  function handleClose() {
    form.reset(DEFAULT_VALUES);
    onOpenChange(false);
  }

  function onSubmit(values: ManualReservationFormValues) {
    if (isBlocked) return;
    mutation.mutate({
      body: {
        member_id: values.memberId,
        schedule_id: values.scheduleId,
        course: values.course as ManualReservationCourse,
        note: values.note?.trim() || undefined,
      },
    });
  }

  return (
    <DialogContent className="flex max-h-[720px] w-full max-w-[560px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]">
      <DialogHeader className="shrink-0 border-b px-6 py-4">
        <DialogTitle>予約手動入力</DialogTitle>
        <DialogDescription>モードBの通知調整を経て確定した予約をCRMに入力します</DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          id="manual-reservation-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
        >
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <p className="mb-1 text-xs font-bold">
                  会員検索（会員ID・氏名） <span className="text-destructive">*</span>
                </p>
                <Select value={field.value} onValueChange={field.onChange} items={memberItems}>
                  <FormControl>
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="会員を選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.member_id} value={m.member_id}>
                        {buildMemberLabel(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
                {blockReason && (
                  <div className="bg-destructive/10 text-destructive mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs">
                    <CircleAlert className="size-4 shrink-0" />
                    {blockReason}
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduleId"
            render={({ field }) => (
              <FormItem>
                <p className="mb-1 text-xs font-bold">
                  セッション枠 <span className="text-destructive">*</span>
                </p>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={scheduleItems}
                  disabled={isBlocked}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="枠を選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {buildScheduleLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  公開設定OFFの枠（非公開枠）にも入力できます
                </p>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="course"
            render={({ field }) => (
              <FormItem>
                <p className="mb-1 text-xs font-bold">
                  コース <span className="text-destructive">*</span>
                </p>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={COURSE_ITEMS}
                  disabled={isBlocked}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="コースを選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COURSE_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  月次プランの場合、残回数を1消費します
                </p>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <p className="mb-1 text-xs font-bold">備考</p>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="備考を入力してください（例: 電話で調整済み）"
                    className="resize-none text-sm"
                    rows={2}
                    disabled={isBlocked}
                    maxLength={TEXTAREA_MAX_LENGTH}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <DialogFooter className="shrink-0 flex-col gap-2 px-6 pb-6 sm:flex-col sm:justify-between">
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-sm"
            onClick={handleClose}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            form="manual-reservation-form"
            size="lg"
            disabled={!canSubmit || mutation.isPending || form.formState.isSubmitting}
          >
            {mutation.isPending ? '登録中...' : '予約を登録'}
          </Button>
        </div>
        <p className="text-muted-foreground w-full text-right text-[10px]">
          入力後、会員のモバイルアプリに予約確定通知を送信します
        </p>
      </DialogFooter>
    </DialogContent>
  );
}

function buildMemberLabel(m: {
  member_id: string;
  name: string;
  plan: string;
  remaining: number | null;
}) {
  return `${m.member_id} ${m.name}（${m.plan === 'monthly' ? `月次プラン 残${m.remaining}回` : '都度払い'}）`;
}

function buildScheduleLabel(s: {
  start_time: string;
  end_time: string;
  studio_name: string | null;
  instructor_name: string;
  is_public: boolean;
}) {
  return `${formatTimeRange(s.start_time, s.end_time)} ${s.studio_name}（${s.instructor_name}）${!s.is_public ? '※非公開枠' : ''}`;
}
