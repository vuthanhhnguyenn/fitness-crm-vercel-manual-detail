'use client';

import { useRouter } from 'next/navigation';

import { formatTime } from '@/utils/date.util';
import { formatDurationMinutes } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, History, IdCard, Mail, Phone } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { getCrmEntryExitLogsByIdQuickViewOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CompanionBadge, FrequencyBadge } from './entry-exit-badges';

interface MemberQuickViewSheetProps {
  /** The clicked activity row's log id, or null when the panel is closed. */
  logId: string | null;
  onOpenChange: (open: boolean) => void;
}

/** FR-B01-05/06: non-modal Member Quick View panel opened from an activity row. */
export function MemberQuickViewSheet({ logId, onOpenChange }: Readonly<MemberQuickViewSheetProps>) {
  const router = useRouter();
  const open = logId !== null;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmEntryExitLogsByIdQuickViewOptions({ path: { id: logId ?? '' } }),
    enabled: open,
  });
  const target = data?.data;

  // 'in-building'/'denied' are produced only by the B-01-01 history screen's
  // row-click (research.md R7) — feature 013's activity feed only ever passes
  // 'entry'/'exit'.
  const CONTEXT_LABELS = {
    entry: {
      text: '入館',
      color: 'bg-success/10 text-success border-success/20',
      timeSuffix: ' 入館',
    },
    exit: {
      text: '退館済み',
      color: 'bg-muted text-muted-foreground border',
      timeSuffix: ' 退館',
    },
    'in-building': {
      text: '在館中',
      color: 'bg-success/10 text-success border-success/20',
      timeSuffix: ' 入館',
    },
    denied: {
      text: '入館拒否',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      timeSuffix: ' 入館試行',
    },
  } as const;
  const contextLabel = target ? CONTEXT_LABELS[target.context] : CONTEXT_LABELS.exit;

  const genderClass =
    target?.gender === 'male'
      ? 'text-gender-male'
      : target?.gender === 'female'
        ? 'text-gender-female'
        : 'text-muted-foreground';
  const genderSymbol = target?.gender === 'male' ? '♂' : target?.gender === 'female' ? '♀' : '';

  const openMemberDetail = () => {
    if (!target) return;
    router.push(navigate('/members/[id]', target.member_id));
  };

  const openMemberDetailInNewTab = () => {
    if (!target) return;
    window.open(navigate('/members/[id]', target.member_id), '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="flex w-[420px] flex-col p-0"
        aria-describedby={undefined}
      >
        <DataStateBoundary
          isLoading={open && isLoading}
          isError={open && isError}
          isEmpty={false}
          onRetry={refetch}
          errorTitle="会員情報の取得に失敗しました"
          skeleton={
            <div className="flex flex-col items-center gap-3 p-6">
              <Skeleton className="size-32 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          }
        >
          {target && (
            <>
              <SheetHeader className="space-y-4 border-b p-0 px-6 py-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="!size-32">
                    <AvatarImage src={target.avatar_url ?? undefined} alt={target.name} />
                    <AvatarFallback className="text-2xl">{target.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <SheetTitle className="text-lg leading-tight font-bold">
                        {target.name}
                      </SheetTitle>
                      {genderSymbol && (
                        <span className={`text-sm font-medium ${genderClass}`}>{genderSymbol}</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">{target.furigana}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge
                      variant="outline"
                      className={`gap-1 px-2 py-0 text-xs ${contextLabel.color}`}
                    >
                      {contextLabel.text}
                    </Badge>
                    <span className="text-2xs text-muted-foreground">
                      {formatTime(target.occurred_at)}
                      {contextLabel.timeSuffix}
                    </span>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-5 p-6">
                  {(target.companion_role || target.frequency_badge) && (
                    <section className="flex flex-col gap-2">
                      <h3 className="text-muted-foreground text-xs font-bold">ステータス</h3>
                      <div className="flex flex-wrap gap-1">
                        {target.companion_role && <CompanionBadge role={target.companion_role} />}
                        {target.frequency_badge && <FrequencyBadge type={target.frequency_badge} />}
                      </div>
                    </section>
                  )}

                  <section className="flex flex-col gap-2">
                    <h3 className="text-muted-foreground text-xs font-bold">契約情報</h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm">{target.contract_name}</p>
                      <p className="text-2xs text-muted-foreground flex items-center gap-1 tabular-nums">
                        <IdCard className="size-3" /> 契約ID: {target.contract_id}
                      </p>
                    </div>
                  </section>

                  <Separator className="-mx-6 w-[calc(100%+48px)]" />

                  <section className="flex flex-col gap-2">
                    <h3 className="text-muted-foreground flex items-center gap-1 text-xs font-bold">
                      <History className="size-3" /> 直近の来館
                    </h3>
                    {target.recent_visits.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {target.recent_visits.map((visit) => (
                          <div
                            key={visit.exit_occurred_at}
                            className="flex items-center justify-between py-1 text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="tabular-nums">
                                {formatTime(visit.exit_occurred_at)}
                              </span>
                              <span className="text-2xs text-muted-foreground">
                                {visit.store_name}
                              </span>
                            </div>
                            <span className="text-2xs text-muted-foreground">
                              滞在{formatDurationMinutes(visit.duration_minutes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-2xs text-muted-foreground">来館履歴はありません。</p>
                    )}
                  </section>

                  <Separator className="-mx-6 w-[calc(100%+48px)]" />

                  <section className="flex flex-col gap-2">
                    <h3 className="text-muted-foreground text-xs font-bold">連絡先</h3>
                    <div className="flex flex-col gap-1 text-xs">
                      {target.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="text-muted-foreground size-3" />
                          <span className="tabular-nums">{target.phone}</span>
                        </div>
                      )}
                      {target.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="text-muted-foreground size-3" />
                          <span className="truncate">{target.email}</span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="bg-background flex items-center gap-2 border-t px-6 py-3">
                <Button className="h-9 flex-1 gap-1 text-xs" onClick={openMemberDetail}>
                  会員詳細を開く
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          className="size-9 p-0"
                          onClick={openMemberDetailInNewTab}
                          aria-label="別タブで開く"
                        />
                      }
                    >
                      <ExternalLink className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      別タブで開く
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          )}
        </DataStateBoundary>
      </SheetContent>
    </Sheet>
  );
}
