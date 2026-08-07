'use client';

import { format, parseISO } from 'date-fns';
import { Bot, Check, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmTransfersByIdResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

type TransferDetail = NonNullable<GetCrmTransfersByIdResponse>['transfer'];
type ApprovalStep = TransferDetail['approval_history'][number];

function formatJST(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy/MM/dd HH:mm');
  } catch {
    return dateStr;
  }
}

function getStepDescription(step: ApprovalStep): string {
  if (step.completed && step.completed_at) {
    const parts = [formatJST(step.completed_at)];
    if (step.completed_by) parts.push(step.completed_by);
    return parts.join(' ');
  }
  if (step.is_automatic) return '自動実行予定';
  return '承認待ち';
}

function getCircleClass(step: ApprovalStep): string {
  if (step.completed) return 'border border-success/30 bg-success/15';
  if (step.is_automatic) return 'border border-info/20 bg-info/10';
  return 'border border-border bg-muted';
}

function StepCircleIcon({ step }: Readonly<{ step: ApprovalStep }>) {
  if (step.completed) return <Check className="text-success size-3" />;
  if (step.is_automatic) return <Bot className="text-info size-3" />;
  return <Clock className="text-muted-foreground size-3" />;
}

function StepItem({ step, isLast }: Readonly<{ step: ApprovalStep; isLast: boolean }>) {
  return (
    <div className="flex gap-3">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full',
            getCircleClass(step),
          )}
        >
          <StepCircleIcon step={step} />
        </div>
        {!isLast && (
          <div
            className={cn('my-1 w-px flex-1', step.completed ? 'bg-success/30' : 'bg-border')}
            style={{ minHeight: '24px' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('text-sm font-medium', !step.completed && 'text-muted-foreground')}>
            {step.label}
          </p>

          {step.store_type === 'from' && (
            <Badge variant="outline" className="text-muted-foreground px-2 py-0 text-[10px]">
              移籍元
            </Badge>
          )}
          {step.store_type === 'to' && (
            <Badge variant="outline" className="text-muted-foreground px-2 py-0 text-[10px]">
              移籍先
            </Badge>
          )}
          {step.is_automatic && (
            <Badge
              variant="outline"
              className="border-info/20 bg-info/10 text-info px-2 py-0 text-[10px]"
            >
              自動実行
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">{getStepDescription(step)}</p>
      </div>
    </div>
  );
}

export function TransferApprovalFlow({ transfer }: Readonly<{ transfer: TransferDetail }>) {
  const isJoyfit = transfer.brand === 'joyfit';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">承認フロー</CardTitle>
          {isJoyfit ? (
            <Badge
              variant="outline"
              className="border-info/20 bg-info/10 text-info text-[10px] font-medium"
            >
              自動移籍
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-warning/20 bg-warning/10 text-warning text-[10px] font-medium"
            >
              手動移籍（2段階承認）
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {/* Brand note */}
        <p className="bg-muted/50 text-muted-foreground mb-4 rounded-md p-2 text-xs">
          {isJoyfit
            ? 'JOYFITの移籍は移籍元店舗の確認・承認後、システムが自動で移籍を実行します。'
            : 'FIT365の移籍は移籍元・移籍先の両店舗の承認が必要です。'}
        </p>

        {/* Timeline */}
        <div className="flex flex-col gap-0">
          {transfer.approval_history.map((step, idx) => (
            <StepItem
              key={step.step}
              step={step}
              isLast={idx === transfer.approval_history.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
