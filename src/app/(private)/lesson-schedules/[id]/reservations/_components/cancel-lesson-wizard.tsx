'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AlertTriangle, CreditCard, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmLessonSchedulesQueryKey,
  postCrmLessonSchedulesByScheduleIdCancelMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem } from '@/lib/api/types.gen';

const REASON_OPTIONS: Record<string, string> = {
  instructor_absent_illness: '講師欠席（体調不良）',
  instructor_absent_other: '講師欠席（その他）',
  facility_trouble: '設備トラブル',
  weather_disaster: '天候・災害',
  insufficient_participants: '参加者不足',
  other: 'その他',
};

const STEP_LABELS = [
  { num: 1, label: '影響確認' },
  { num: 2, label: '理由入力' },
  { num: 3, label: '最終確認' },
];

interface CancelLessonWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  schedule: LessonScheduleListItem;
  onCancelled?: () => void;
}

export function CancelLessonWizard({
  open,
  onOpenChange,
  scheduleId,
  schedule,
  onCancelled,
}: CancelLessonWizardProps) {
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState<'this_only' | 'all_after'>('this_only');
  const [reason, setReason] = useState('instructor_absent_illness');
  const [reasonDetail, setReasonDetail] = useState('');
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [processRefund, setProcessRefund] = useState(true);
  const [notifyInstructor, setNotifyInstructor] = useState(false);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    ...postCrmLessonSchedulesByScheduleIdCancelMutation(),
    onSuccess: () => {
      toast.success('レッスンを中止しました', {
        description: '予約者への通知・返金処理を開始しました',
      });
      onCancelled?.();
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('レッスンの中止に失敗しました');
    },
  });

  const handleClose = (nextOpen?: boolean) => {
    if (nextOpen === false || nextOpen === undefined) {
      setStep(1);
      setScope('this_only');
      setReason('instructor_absent_illness');
      setReasonDetail('');
      setNotifyMembers(true);
      setProcessRefund(true);
      setNotifyInstructor(false);
    }
    onOpenChange(nextOpen ?? false);
  };

  const handleConfirm = () => {
    cancelMutation.mutate({
      path: { scheduleId },
      body: {
        scope,
        cancel_reason: reason,
        cancel_reason_detail: reasonDetail || undefined,
        send_notification: notifyMembers,
        process_refund: processRefund,
        notify_instructor: notifyInstructor,
      },
    });
  };

  const formatScheduleDate = () => {
    try {
      return format(new Date(schedule.start_time), 'M/d（E）HH:mm', { locale: ja });
    } catch {
      return schedule.start_time;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[560px] gap-0 p-0">
        {/* Header */}
        <div className="bg-destructive/10 border-destructive/20 rounded-t-lg border-b px-6 py-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 flex size-10 items-center justify-center rounded-full">
                <AlertTriangle className="text-destructive size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">レッスンを中止する</DialogTitle>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  中止すると予約者への通知と返金処理が発生します
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 border-b px-6 py-3">
          {STEP_LABELS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              {i > 0 && <div className="bg-border h-px w-6" />}
              <div
                className={`flex items-center gap-1 ${s.num === step ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                <div
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    s.num === step
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.num}
                </div>
                <span className="text-xs font-medium">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[480px] space-y-4 overflow-y-auto px-6 py-4">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <div className="bg-destructive/10 border-destructive/20 rounded-lg border px-4 py-3">
                <p className="text-destructive text-sm font-bold">この枠の開催を中止します。</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  既存予約は{schedule.booked_count}
                  件あります。中止すると予約者全員に通知され、予約はキャンセルされます。データ自体は履歴として残ります。
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{schedule.lesson_name}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatScheduleDate()}
                      {schedule.studio_name ? ` | ${schedule.studio_name}` : ''}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      インストラクター: {schedule.instructor_name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {schedule.lesson_type === 'studio' ? 'スタジオレッスン' : 'パーソナル'}
                  </Badge>
                </div>
              </div>

              {/* Cancel scope */}
              <div>
                <Label className="mb-2 block text-xs font-medium">中止範囲</Label>
                <div className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-sm ${scope === 'this_only' ? 'bg-info/10 border-info/20' : ''}`}
                    onClick={() => setScope('this_only')}
                  >
                    <div
                      className={`flex size-4 items-center justify-center rounded-full border-2 ${scope === 'this_only' ? 'border-primary' : 'border-muted-foreground/30'}`}
                    >
                      {scope === 'this_only' && <div className="bg-primary size-2 rounded-full" />}
                    </div>
                    この回のみ中止
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-sm ${scope === 'all_after' ? 'bg-info/10 border-info/20' : ''}`}
                    onClick={() => setScope('all_after')}
                  >
                    <div
                      className={`flex size-4 items-center justify-center rounded-full border-2 ${scope === 'all_after' ? 'border-primary' : 'border-muted-foreground/30'}`}
                    >
                      {scope === 'all_after' && <div className="bg-primary size-2 rounded-full" />}
                    </div>
                    以降すべて中止
                  </label>
                </div>
              </div>

              {/* Impact summary */}
              <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
                <p className="text-destructive mb-3 text-xs font-bold">中止による影響</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-destructive/10 flex size-8 items-center justify-center rounded-full">
                      <Users className="text-destructive size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{schedule.booked_count}名</p>
                      <p className="text-muted-foreground text-[10px]">予約キャンセル</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-destructive/10 flex size-8 items-center justify-center rounded-full">
                      <Mail className="text-destructive size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{schedule.booked_count}通</p>
                      <p className="text-muted-foreground text-[10px]">通知送信</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-destructive/10 flex size-8 items-center justify-center rounded-full">
                      <CreditCard className="text-destructive size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">要確認</p>
                      <p className="text-muted-foreground text-[10px]">返金処理</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <div>
                <Label className="mb-2 block text-xs font-medium">中止理由</Label>
                <Select value={reason} onValueChange={(v) => v && setReason(v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue>{REASON_OPTIONS[reason]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REASON_OPTIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  className="mt-2 min-h-[60px] text-sm"
                  placeholder="詳細を入力"
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-2 block text-xs font-medium">通知設定</Label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={notifyMembers}
                      onCheckedChange={(v) => setNotifyMembers(!!v)}
                    />
                    中止のお知らせを送信する
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={processRefund}
                      onCheckedChange={(v) => setProcessRefund(!!v)}
                    />
                    自動返金処理を行う
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={notifyInstructor}
                      onCheckedChange={(v) => setNotifyInstructor(!!v)}
                    />
                    インストラクターに通知する
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{schedule.lesson_name}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {formatScheduleDate()}
                        {schedule.studio_name ? ` | ${schedule.studio_name}` : ''}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {schedule.lesson_type === 'studio' ? 'スタジオレッスン' : 'パーソナル'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">中止範囲</span>
                    <span className="text-xs font-medium">
                      {scope === 'this_only' ? 'この回のみ' : '以降すべて'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">中止理由</span>
                    <span className="text-xs font-medium">{REASON_OPTIONS[reason] ?? reason}</span>
                  </div>
                  {reasonDetail && (
                    <>
                      <Separator />
                      <div className="text-muted-foreground text-xs">{reasonDetail}</div>
                    </>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">通知送信</span>
                    <span className="text-xs font-medium">{notifyMembers ? 'する' : 'しない'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">自動返金</span>
                    <span className="text-xs font-medium">{processRefund ? 'する' : 'しない'}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">講師への通知</span>
                    <span className="text-xs font-medium">
                      {notifyInstructor ? 'する' : 'しない'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-info/10 border-info/20 rounded-lg border p-3">
                <p className="text-info text-xs">
                  この操作は操作ログに記録されます。中止後の予約者への通知・返金は自動処理されますが、個別対応が必要な場合は手動で処理してください。
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3">
          {step === 1 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleClose(false)}>
                キャンセル
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setStep(2)}>
                次へ：理由を入力
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                戻る
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setStep(3)}>
                次へ：最終確認
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                戻る
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelMutation.isPending}
                onClick={handleConfirm}
              >
                この内容でレッスンを中止する
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
