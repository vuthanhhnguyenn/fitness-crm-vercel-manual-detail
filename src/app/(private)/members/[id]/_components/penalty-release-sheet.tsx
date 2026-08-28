'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { formatDateTime } from '@/utils/format.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmMembersByIdQueryKey,
  postCrmMembersByIdPenaltyReleaseMutation,
} from '@/lib/api/@tanstack/react-query.gen';

type PenaltyReleaseReason = 'issue_resolved' | 'wrong_setting' | 'special_case' | 'other';

const RELEASE_REASON_OPTIONS: { value: PenaltyReleaseReason; label: string }[] = [
  { value: 'issue_resolved', label: '問題解決済み' },
  { value: 'wrong_setting', label: '誤設定' },
  { value: 'special_case', label: '特別対応' },
  { value: 'other', label: 'その他' },
];

const PENALTY_TYPE_LABELS: Record<string, string> = {
  studio: 'スタジオ予約',
  personal_training: 'パーソナルトレーニング',
  body_care: 'ボディケア',
};

const penaltyReleaseFormSchema = z.object({
  reason: z.enum(['issue_resolved', 'wrong_setting', 'special_case', 'other'], {
    message: '解除理由は必須です',
  }),
  detail: z.string().optional(),
  confirmed: z.boolean().refine((v) => v, { message: '内容の確認チェックが必要です' }),
});

type PenaltyReleaseFormValues = z.infer<typeof penaltyReleaseFormSchema>;

interface ActivePenalty {
  penaltyType: string;
  endAt: string;
  noShowCount?: number;
  appliedAt?: string;
  /** D-01 FR-010: the reservations behind `noShowCount`, listed read-only before release */
  triggeringReservations?: string[];
  targetWeek?: string;
}

interface PenaltyReleaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  penalty: ActivePenalty | null | undefined;
}

export function PenaltyReleaseSheet({
  open,
  onOpenChange,
  memberId,
  penalty,
}: Readonly<PenaltyReleaseSheetProps>) {
  const queryClient = useQueryClient();

  // FR-007: the release takes effect immediately, so it gets both the acknowledgement
  // checkbox and a confirm dialog.
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<PenaltyReleaseFormValues>({
    resolver: zodResolver(penaltyReleaseFormSchema),
    defaultValues: { reason: undefined, detail: '', confirmed: false },
  });
  // Drives the footer submit button; RHF is the single source of truth for the checkbox state
  const confirmed = useWatch({ control: form.control, name: 'confirmed' });

  const mutation = useMutation({
    ...postCrmMembersByIdPenaltyReleaseMutation(),
    onSuccess: () => {
      toast.success('予約ペナルティを解除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      handleClose();
    },
    onError: () => {
      toast.error('予約ペナルティの解除に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset({ reason: undefined, detail: '', confirmed: false });
    }, 300);
  };

  // Validate first, then ask for confirmation; the mutation only runs from the dialog.
  const handleSubmit = form.handleSubmit(() => {
    setShowConfirm(true);
  });

  const handleConfirm = () => {
    setShowConfirm(false);
    const data = form.getValues();
    mutation.mutate({
      path: { id: memberId },
      body: { reason: data.reason, detail: data.detail || undefined },
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <CalendarOff className="size-4" />
                予約ペナルティ解除
              </SheetTitle>
              <SheetDescription className="sr-only">予約ペナルティ解除フォーム</SheetDescription>
            </SheetHeader>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6">
                {/* Current penalty info */}
                <div className="py-4">
                  <div className="bg-muted/40 flex flex-col gap-2 rounded-md p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">
                      現在のペナルティ
                    </p>
                    {penalty ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <p className="text-muted-foreground text-xs">対象</p>
                          <p className="text-sm font-medium">
                            {PENALTY_TYPE_LABELS[penalty.penaltyType] ?? penalty.penaltyType}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">予約不可期限</p>
                          <p className="text-sm font-medium">{formatDateTime(penalty.endAt)}</p>
                        </div>
                        {penalty.noShowCount != null && (
                          <div>
                            <p className="text-muted-foreground text-xs">無断キャンセル回数</p>
                            <p className="text-sm font-medium">{penalty.noShowCount}回</p>
                          </div>
                        )}
                        {penalty.appliedAt && (
                          <div>
                            <p className="text-muted-foreground text-xs">適用日</p>
                            <p className="text-sm font-medium">
                              {formatDateTime(penalty.appliedAt)}
                            </p>
                          </div>
                        )}
                        {penalty.targetWeek && (
                          <div>
                            <p className="text-muted-foreground text-xs">対象週</p>
                            <p className="text-sm font-medium">{penalty.targetWeek}</p>
                          </div>
                        )}
                        {penalty.triggeringReservations &&
                          penalty.triggeringReservations.length > 0 && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground text-xs">対象となった予約</p>
                              {penalty.triggeringReservations.map((reservation) => (
                                <p key={reservation} className="text-sm font-medium">
                                  {reservation}
                                </p>
                              ))}
                            </div>
                          )}
                        {/* D-01 FR-010: releasing notifies the member, so say so before it happens */}
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">会員への通知</p>
                          <p className="text-sm font-medium">
                            解除完了を会員アプリへ自動送信します
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">ペナルティ情報なし</p>
                    )}
                  </div>
                </div>

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                <div className="flex flex-col gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          解除理由 <span className="text-destructive ml-1 text-xs">*</span>
                        </FormLabel>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v as PenaltyReleaseReason)}
                          items={RELEASE_REASON_OPTIONS}
                        >
                          <FormControl>
                            <SelectTrigger id="penalty-release-reason" className="h-9 text-sm">
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RELEASE_REASON_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="detail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          詳細 <span className="text-muted-foreground ml-1 text-xs">任意</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            maxLength={TEXTAREA_MAX_LENGTH}
                            rows={2}
                            className="resize-none text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmed"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-2 pt-1">
                          <FormControl>
                            <Checkbox
                              id="penalty-release-confirm"
                              checked={field.value}
                              onCheckedChange={(v) => field.onChange(v === true)}
                            />
                          </FormControl>
                          <Label
                            htmlFor="penalty-release-confirm"
                            className="cursor-pointer text-sm leading-snug"
                          >
                            上記の内容を確認し、予約ペナルティを解除します
                          </Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex shrink-0 gap-2 border-t px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={mutation.isPending}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!confirmed || mutation.isPending}
                >
                  解除する
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirm AlertDialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>予約ペナルティを解除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              解除後、会員はすぐにレッスン予約が可能になります。解除記録は変更履歴に残り、会員へ通知が送信されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>解除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
