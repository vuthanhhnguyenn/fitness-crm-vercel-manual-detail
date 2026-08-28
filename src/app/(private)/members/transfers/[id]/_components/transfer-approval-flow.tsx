import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Bot, Check, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { TransferBrand, TransferDetail } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  APPROVAL_STEP_STORE_TYPE_LABELS,
  TRANSFER_FLOW_BADGE_LABELS,
  TRANSFER_FLOW_NOTES,
} from '../../_constants/constants';

type ApprovalStep = TransferDetail['approval_history'][number];

/**
 * The sub-line under each step label. The API models the step, not its prose, so the wording is
 * derived here: a finished step reports when and by whom, a pending automatic step reports when
 * the system will run it, and anything else is simply waiting.
 */
function getStepDescription(step: ApprovalStep, scheduledDate: string): string {
  if (step.completed && step.completed_at) {
    const parts = [formatDateYYYYMMDD_HHMM(step.completed_at)];
    if (step.completed_by) parts.push(step.completed_by);
    return parts.join(' ');
  }
  if (step.is_automatic) return `自動実行予定: ${formatDateYYYYMMDD(scheduledDate)}`;
  return '承認待ち';
}

function getCircleClass(step: ApprovalStep, isCurrent: boolean): string {
  if (step.completed) return 'border border-success/30 bg-success/15';
  if (step.is_automatic) return 'border border-info/20 bg-info/15';
  if (isCurrent) return 'border border-warning/30 bg-warning/15';
  return 'border border-border bg-muted';
}

/**
 * Rendered as its own component so the icon type is resolved at module scope rather than during
 * StepItem's render — a component value created per render would remount and lose state.
 */
function StepIcon({ step, isCurrent }: Readonly<{ step: ApprovalStep; isCurrent: boolean }>) {
  if (step.completed) return <Check className="text-success size-3" />;
  if (step.is_automatic) return <Bot className="text-info size-3" />;
  if (isCurrent) return <Clock className="text-warning size-3" />;
  return <Clock className="text-muted-foreground size-3" />;
}

function StepItem({
  step,
  isLast,
  isCurrent,
  scheduledDate,
}: Readonly<{ step: ApprovalStep; isLast: boolean; isCurrent: boolean; scheduledDate: string }>) {
  return (
    <div className="flex gap-3">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full',
            getCircleClass(step, isCurrent),
          )}
        >
          <StepIcon step={step} isCurrent={isCurrent} />
        </div>
        {!isLast && (
          <div
            className={cn(
              'my-1 min-h-6 w-px flex-1',
              step.completed ? 'bg-success/30' : 'bg-border',
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium',
              !step.completed && !isCurrent && 'text-muted-foreground',
            )}
          >
            {step.label}
          </p>

          {step.store_type && (
            <Badge variant="outline" className="text-muted-foreground px-2 py-0 text-[10px]">
              {APPROVAL_STEP_STORE_TYPE_LABELS[step.store_type]}
            </Badge>
          )}
          {step.is_automatic && (
            <Badge
              variant="outline"
              className="border-info/20 bg-info/15 text-info px-2 py-0 text-[10px]"
            >
              自動実行
            </Badge>
          )}
          {isCurrent && !step.is_automatic && (
            <Badge
              variant="outline"
              className="border-warning/20 bg-warning/15 text-warning px-2 py-0 text-[10px]"
            >
              対応待ち
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {getStepDescription(step, scheduledDate)}
        </p>
      </div>
    </div>
  );
}

const FLOW_BADGE_CLASSES: Record<TransferBrand, string> = {
  joyfit: 'border-info/20 bg-info/15 text-info',
  fit365: 'border-warning/20 bg-warning/15 text-warning',
};

/**
 * 承認フロー timeline. Step count and shape come from the server's brand-aware
 * `approval_history` — 3 steps for JOYFIT, 4 for FIT365 — so this component never has to know
 * the flow rules, only how to draw them.
 */
export function TransferApprovalFlow({ transfer }: Readonly<{ transfer: TransferDetail }>) {
  const brand = transfer.brand;
  // The first not-yet-completed step is the one actually awaiting action right now — it needs to
  // read differently from both a done step and a step that hasn't been reached yet (BUG-A0201-05).
  const currentStepIdx = transfer.approval_history.findIndex((step) => !step.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">承認フロー</CardTitle>
          <Badge variant="outline" className={cn('text-xs font-medium', FLOW_BADGE_CLASSES[brand])}>
            {TRANSFER_FLOW_BADGE_LABELS[brand]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <p className="bg-muted/50 text-muted-foreground mb-4 rounded-md p-2 text-xs">
          {TRANSFER_FLOW_NOTES[brand]}
        </p>

        <div className="flex flex-col gap-0">
          {transfer.approval_history.map((step, idx) => (
            <StepItem
              key={step.step}
              step={step}
              isLast={idx === transfer.approval_history.length - 1}
              isCurrent={idx === currentStepIdx}
              scheduledDate={transfer.scheduled_date}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
