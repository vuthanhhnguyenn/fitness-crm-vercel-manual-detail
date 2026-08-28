'use client';

/**
 * SuspensionHistoryStrip — shared per-month strip of suspension / withdrawal history.
 * A presentational component meant to be shared by leave-detail / member-detail (as in the
 * prototype); data fetching is the caller's job (e.g. the member-detail contracts-tab wrapper).
 * Owns the whole Card: header (title + period nav) / strip / footer band (legend + link).
 */
import { useState } from 'react';

import Link from 'next/link';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Types ---
export type SuspensionStatus = 'active' | 'pending-leave' | 'pending-retire' | 'normal';
export type SuspensionHistoryCell = { status: SuspensionStatus; applicationId?: string };

export interface SuspensionHistoryStripProps {
  /** Card title */
  title: string;
  /** key: "YYYY/MM", value: status and application ID */
  history: Record<string, SuspensionHistoryCell>;
  /** Current month (reference point), e.g. "2026/05" */
  currentYearMonth: string;
  /** Number of months to display (default 12) */
  windowSize?: number;
  /** Content rendered instead of the strip body (for injecting Loading/Error states) */
  stripOverride?: React.ReactNode;
  /** Destination of the "view applications" link. Build it with `navigate()`. */
  viewApplicationsHref: string;
  /** Label of the "view applications" link (varies per screen) */
  viewApplicationsLabel: string;
}

const STATUS_LABELS: Record<Exclude<SuspensionStatus, 'normal'>, string> = {
  active: '休会中',
  'pending-leave': '休会予定',
  'pending-retire': '退会予定',
};

const STATUS_BADGE_CLASSES: Record<Exclude<SuspensionStatus, 'normal'>, string> = {
  active: 'border-info/20 bg-info/15 text-info',
  'pending-leave': 'border-warning/20 bg-warning/15 text-warning',
  'pending-retire': 'border-destructive/20 bg-destructive/15 text-destructive',
};

// --- Helpers: add / diff "YYYY/MM" (kept local so the presentational part stays self-contained) ---
function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('/').map(Number);
  const d = new Date(y!, m! - 1 + delta, 1);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function diffMonths(a: string, b: string): number {
  const [ay, am] = a.split('/').map(Number);
  const [by, bm] = b.split('/').map(Number);
  return (ay! - by!) * 12 + (am! - bm!);
}

export function SuspensionHistoryStrip({
  title,
  history,
  currentYearMonth,
  windowSize = 12,
  stripOverride,
  viewApplicationsHref,
  viewApplicationsLabel,
}: Readonly<SuspensionHistoryStripProps>) {
  const halfBack = Math.floor(windowSize / 2);
  const halfFwd = windowSize - halfBack - 1;

  // anchor = center month of the visible window; defaults to the current month
  const [anchor, setAnchor] = useState(currentYearMonth);

  const windowStart = addMonths(anchor, -halfBack);
  const windowEnd = addMonths(anchor, halfFwd);

  // Navigable range relative to currentYearMonth
  const minAnchor = addMonths(currentYearMonth, -18);
  const maxAnchor = addMonths(currentYearMonth, 7);

  const canPrev = diffMonths(anchor, minAnchor) > 0;
  const canNext = diffMonths(maxAnchor, anchor) > 0;

  const isCurrentVisible =
    diffMonths(currentYearMonth, windowStart) >= 0 && diffMonths(windowEnd, currentYearMonth) >= 0;

  const cells: string[] = [];
  for (let i = 0; i < windowSize; i++) {
    cells.push(addMonths(windowStart, i));
  }

  const handlePrev = () => {
    const next = addMonths(anchor, -halfBack);
    setAnchor(diffMonths(next, minAnchor) >= 0 ? next : minAnchor);
  };

  const handleNext = () => {
    const next = addMonths(anchor, halfFwd + 1);
    setAnchor(diffMonths(maxAnchor, next) >= 0 ? next : maxAnchor);
  };

  const handleGoToday = () => setAnchor(currentYearMonth);

  return (
    <Card className="pb-0">
      {/* ── Layer 1: header (title + period nav) ── */}
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardAction className="flex items-center gap-1">
          {!isCurrentVisible && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary h-7 text-xs"
              onClick={handleGoToday}
            >
              今へ戻る
            </Button>
          )}
          <Button
            variant="ghost"
            className="size-8 p-0"
            disabled={!canPrev}
            onClick={handlePrev}
            aria-label="前の期間"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
            {windowStart} 〜 {windowEnd}
          </span>
          <Button
            variant="ghost"
            className="size-8 p-0"
            disabled={!canNext}
            onClick={handleNext}
            aria-label="次の期間"
          >
            <ChevronRight className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>

      {/* ── Layer 2: strip ── */}
      <CardContent className="px-4">
        {stripOverride ?? (
          <div className="overflow-x-auto">
            <div className="flex w-full gap-1">
              {cells.map((ym) => {
                const { status, applicationId } = history[ym] ?? { status: 'normal' };
                const isToday = ym === currentYearMonth;
                const monthNum = ym.slice(5).replace(/^0/, '');
                const yearShort = ym.slice(2, 4);

                return (
                  <div
                    key={ym}
                    className={`flex min-w-12 flex-1 flex-col items-center gap-1 py-1.5 ${
                      isToday ? 'bg-primary/5 rounded-md px-1.5' : ''
                    }`}
                  >
                    {/* Annotation area — fixed 3-row grid (current month / status / application ID) keeps every cell's month block top-aligned */}
                    <div className="grid w-full min-w-0 grid-rows-[16px_16px_14px] gap-0.5">
                      <div className="flex items-end justify-center">
                        {isToday && (
                          <Badge className="bg-primary text-primary-foreground h-4 border-transparent px-1.5 py-0 text-[9px] leading-tight">
                            今月
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-end justify-center">
                        {status !== 'normal' && (
                          <Badge
                            variant="outline"
                            className={`h-4 px-1 py-0 text-[9px] leading-tight ${STATUS_BADGE_CLASSES[status]}`}
                          >
                            {STATUS_LABELS[status]}
                          </Badge>
                        )}
                      </div>
                      {applicationId ? (
                        <p
                          className="text-muted-foreground w-full self-end truncate text-center font-mono text-[9px] leading-tight"
                          title={applicationId}
                        >
                          {applicationId}
                        </p>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div
                      className={`flex h-7 w-full items-center justify-center rounded-sm font-medium ${
                        isToday && status === 'active'
                          ? 'bg-info text-info-foreground'
                          : isToday && status === 'pending-leave'
                            ? 'bg-warning text-warning-foreground'
                            : isToday && status === 'pending-retire'
                              ? 'bg-destructive text-destructive-foreground'
                              : isToday
                                ? 'bg-primary text-primary-foreground'
                                : status === 'active'
                                  ? 'bg-info/20 text-info'
                                  : status === 'pending-leave'
                                    ? 'bg-warning/20 text-warning'
                                    : status === 'pending-retire'
                                      ? 'bg-destructive/20 text-destructive'
                                      : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <span className="text-xs leading-none">{monthNum}月</span>
                    </div>

                    <p className="text-muted-foreground text-[10px]">{yearShort}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* ── Layer 3: footer band (legend + link) ── */}
      <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-b-xl border-t px-4 py-3">
        <div className="text-muted-foreground flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="bg-info inline-block size-2 rounded-full" />
            休会中
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-warning inline-block size-2 rounded-full" />
            休会予定
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-destructive inline-block size-2 rounded-full" />
            退会予定
          </span>
        </div>
        <Button
          nativeButton={false}
          variant="link"
          className="h-auto shrink-0 p-0 text-xs"
          render={<Link href={viewApplicationsHref} />}
        >
          {viewApplicationsLabel}
        </Button>
      </div>
    </Card>
  );
}
