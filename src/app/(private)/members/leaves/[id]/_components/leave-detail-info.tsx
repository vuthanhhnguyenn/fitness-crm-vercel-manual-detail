import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Check, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLeavesByIdResponse } from '@/lib/api/types.gen';
import { LeaveStatus, LeaveType } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  LEAVE_TYPE_CLASSES,
  LEAVE_TYPE_LABELS,
  PROXY_AGREEMENT_METHOD_LABELS,
} from '../../_constants/constants';

type LeaveDetail = NonNullable<GetCrmLeavesByIdResponse>['leave'];

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function LeaveDetailInfo({ leave }: Readonly<{ leave: LeaveDetail }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">申請情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {/* FR-058 — the human-readable application number, never the record id. */}
          <Field label="申請ID">
            <span className="font-mono">{leave.application_number}</span>
          </Field>

          <Field label="種別">
            <Badge variant="outline" className={cn('text-[10px]', LEAVE_TYPE_CLASSES[leave.type])}>
              {LEAVE_TYPE_LABELS[leave.type]}
            </Badge>
          </Field>

          <Field label={leave.type === LeaveType.SUSPENSION ? '休会開始月' : '退会予定日'}>
            {leave.scheduled_date}
          </Field>

          <Field label={leave.type === LeaveType.SUSPENSION ? '休会終了月' : '終了日'}>
            {leave.type === LeaveType.WITHDRAWAL ? '—' : (leave.end_date ?? '—')}
          </Field>

          <div className="col-span-2">
            <Field label="理由">{leave.reason}</Field>
          </div>

          <Field label="申請者">{leave.applicant}</Field>

          <Field label="申請日時">{formatDateYYYYMMDD_HHMM(leave.applied_at)}</Field>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaveApprovalFlow({ leave }: Readonly<{ leave: LeaveDetail }>) {
  /**
   * FR-063 — step 2 is complete unless the application is still awaiting approval, and on
   * A-03 nothing ever is: an application is raised on A-01-01 and only reaches this screen
   * once approved (A-03 L68-L70), so every status this screen can render — including
   * 取り消し済み — sits past the approval. The backend contract says the same for the one
   * case that looks like an exception: `TimelineStepState` documents that "cancelled
   * applications have no current step — completed steps stay completed, the rest stay
   * pending". Cancelling therefore leaves 承認 done and 退会処理実行 waiting; the cancellation
   * itself is reported by the status card, not by regressing the flow.
   *
   * The caption reads `approved_at`, never `updated_at` — a cancellation moves `updated_at`
   * onto itself and would relabel the approval with the moment it was undone.
   */
  const step3Done = leave.status === LeaveStatus.COMPLETED;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">承認フロー</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-0">
          {/* Step 1: 申請 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="border-success/30 bg-success/15 flex size-6 shrink-0 items-center justify-center rounded-full border">
                <Check className="text-success size-3" />
              </div>
              <div className="bg-success/30 my-1 w-px flex-1" style={{ minHeight: '24px' }} />
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium">申請</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatDateYYYYMMDD_HHMM(leave.applied_at)}{' '}
                {leave.is_proxy_applied ? (leave.proxy_applicant ?? '') : leave.applicant}
              </p>
            </div>
          </div>

          {/* Step 2: 承認 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="border-success/30 bg-success/15 flex size-6 shrink-0 items-center justify-center rounded-full border">
                <Check className="text-success size-3" />
              </div>
              {leave.type === LeaveType.WITHDRAWAL && (
                <div className="bg-success/30 my-1 w-px flex-1" style={{ minHeight: '24px' }} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium">
                {leave.type === LeaveType.SUSPENSION ? '休会承認' : '退会承認'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatDateYYYYMMDD_HHMM(leave.approved_at ?? leave.updated_at)}
              </p>
            </div>
          </div>

          {/* Step 3: 退会処理実行（退会のみ） */}
          {leave.type === LeaveType.WITHDRAWAL && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full',
                    step3Done
                      ? 'border-success/30 bg-success/15 border'
                      : 'border-border bg-muted border',
                  )}
                >
                  {step3Done ? (
                    <Check className="text-success size-3" />
                  ) : (
                    <Clock className="text-muted-foreground size-3" />
                  )}
                </div>
              </div>
              <div className="flex-1 pb-4">
                <p className={cn('text-sm font-medium', !step3Done && 'text-muted-foreground')}>
                  退会処理実行
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {step3Done ? '処理完了' : '待機中'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaveProxyInfo({ leave }: Readonly<{ leave: LeaveDetail }>) {
  if (!leave.is_proxy_applied) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">代理申請情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="代理申請者">{leave.proxy_applicant ?? '—'}</Field>
          {/* `formatDateYYYYMMDD_HHMM` already falls back to '—' on a null/unparsable value. */}
          <Field label="合意日時">{formatDateYYYYMMDD_HHMM(leave.consent_at)}</Field>
          <Field label="合意方法">
            {leave.consent_method ? PROXY_AGREEMENT_METHOD_LABELS[leave.consent_method] : '—'}
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaveRelatedInfo({ leave }: Readonly<{ leave: LeaveDetail }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">関連情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {/*
            FR-067 — withdrawals show their real cancellation fee. V0 hardcoded '—' here,
            which is a display defect and is not reproduced (Q-07).
          */}
          <Field label={leave.type === LeaveType.SUSPENSION ? '休会費' : '退会手数料'}>
            {leave.type === LeaveType.SUSPENSION
              ? leave.suspension_fee != null
                ? `¥${leave.suspension_fee.toLocaleString()}/月`
                : '—'
              : leave.withdrawal_fee != null
                ? `¥${leave.withdrawal_fee.toLocaleString()}`
                : '—'}
          </Field>

          <Field label="適用キャンペーン">{leave.applied_campaign}</Field>

          <Field label="未消化レッスン">{leave.unused_lessons}回</Field>

          <Field label="未納金">
            <span className={cn(leave.unpaid_amount > 0 && 'text-destructive')}>
              ¥{leave.unpaid_amount.toLocaleString()}
            </span>
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
