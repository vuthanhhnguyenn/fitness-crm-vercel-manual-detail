'use client';

import Link from 'next/link';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Check, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLeavesByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { LEAVE_TYPE_CLASSES, LEAVE_TYPE_LABELS } from '../../_constants/constants';

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
        <CardTitle className="text-sm">申請情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="申請ID">
            <span className="font-mono">{leave.id}</span>
          </Field>

          <Field label="会員名">
            <Button
              nativeButton={false}
              variant="link"
              className="h-auto p-0 text-sm font-medium"
              render={<Link href={navigate('/members/[id]', leave.member_id)} />}
            >
              {leave.member_name}
            </Button>
          </Field>

          <Field label="店舗名">{leave.store_name}</Field>

          <Field label="種別">
            <Badge variant="outline" className={cn('text-[10px]', LEAVE_TYPE_CLASSES[leave.type])}>
              {LEAVE_TYPE_LABELS[leave.type]}
            </Badge>
          </Field>

          <Field label={leave.type === 'suspension' ? '休会開始月' : '退会予定日'}>
            {leave.scheduled_date}
          </Field>

          <Field label={leave.type === 'suspension' ? '休会終了月' : '終了日'}>
            {leave.type === 'withdrawal' ? '—' : (leave.end_date ?? '—')}
          </Field>

          <div className="col-span-2">
            <Field label="理由">{leave.reason}</Field>
          </div>

          <Field label="申請者">{leave.applicant}</Field>

          <Field label="申請日時">{leave.applied_at}</Field>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaveApprovalFlow({ leave }: Readonly<{ leave: LeaveDetail }>) {
  const step2Done = !['suspension_scheduled', 'withdrawal_scheduled'].includes(leave.status);
  const step3Done = leave.status === 'completed';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">承認フロー</CardTitle>
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
                {leave.applied_at}{' '}
                {leave.is_proxy_applied ? (leave.proxy_applicant ?? '') : leave.applicant}
              </p>
            </div>
          </div>

          {/* Step 2: 承認 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  step2Done
                    ? 'border-success/30 bg-success/15 border'
                    : 'border-border bg-muted border',
                )}
              >
                {step2Done ? (
                  <Check className="text-success size-3" />
                ) : (
                  <Clock className="text-muted-foreground size-3" />
                )}
              </div>
              {leave.type === 'withdrawal' && (
                <div
                  className={cn('my-1 w-px flex-1', step2Done ? 'bg-success/30' : 'bg-border')}
                  style={{ minHeight: '24px' }}
                />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className={cn('text-sm font-medium', !step2Done && 'text-muted-foreground')}>
                {leave.type === 'suspension' ? '休会承認' : '退会承認'}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {step2Done ? leave.updated_at : '承認待ち'}
              </p>
            </div>
          </div>

          {/* Step 3: 退会処理実行（退会のみ） */}
          {leave.type === 'withdrawal' && (
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
        <CardTitle className="text-sm">代理申請情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="代理申請者">{leave.proxy_applicant ?? '—'}</Field>
          <Field label="合意日時">{formatDateYYYYMMDD_HHMM(leave.consent_at) ?? '—'}</Field>
          <Field label="合意方法">{leave.consent_method ?? '—'}</Field>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaveRelatedInfo({ leave }: Readonly<{ leave: LeaveDetail }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">関連情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label={leave.type === 'suspension' ? '休会費' : '退会手数料'}>
            {leave.type === 'suspension' && leave.suspension_fee != null
              ? `¥${leave.suspension_fee.toLocaleString()}/月`
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
