'use client';

import { formatTime } from '@/utils/date.util';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmEntryExitLogsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { CompanionBadge, FrequencyBadge } from './entry-exit-badges';

const COLUMN_COUNT = 4;
const SKELETON_ROW_COUNT = 5;

interface ActivityTableProps {
  title: string;
  direction: 'entry' | 'exit';
  date?: string;
  storeId?: string;
  /** Set to false while the caller's store scope is still resolving, to avoid an extra fetch. */
  enabled?: boolean;
  /** FR-B01-05: opens the Member Quick View panel for the clicked row. */
  onSelectRow?: (logId: string) => void;
}

function ActivityTableSkeleton() {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: COLUMN_COUNT }).map((__, col) => (
              <TableCell key={col} className="px-3 py-2">
                <Skeleton className="h-4 w-full max-w-[120px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** FR-B01-01/02/03/04: shared 入館/退館 table showing the 5 most recent rows for a direction. */
export function ActivityTable({
  title,
  direction,
  date,
  storeId,
  enabled = true,
  onSelectRow,
}: Readonly<ActivityTableProps>) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmEntryExitLogsOptions({
      query: {
        direction,
        limit: 5,
        ...(date ? { date } : {}),
        ...(storeId ? { store_id: storeId } : {}),
      },
    }),
    enabled,
  });

  const rows = data?.data ?? [];

  // "本日" for today's realtime view; the selected date otherwise so the empty
  // state doesn't claim "today" when a past/other date is being viewed.
  const dateLabel =
    !date || isToday(parseISO(date))
      ? '本日'
      : format(parseISO(date), 'yyyy年M月d日', { locale: ja });

  return (
    <Card className="flex-1 gap-0 overflow-hidden py-0">
      <div className="bg-muted/50 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {direction === 'entry' ? (
            <ArrowLeft className="text-success size-4" />
          ) : (
            <ArrowRight className="text-muted-foreground size-4" />
          )}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="text-muted-foreground text-xs">最新5件</span>
      </div>

      <DataStateBoundary
        isLoading={isLoading || !enabled}
        isError={isError}
        isEmpty={rows.length === 0}
        onRetry={refetch}
        emptyTitle={`${dateLabel}の${title}記録はありません`}
        emptyDescription="日付や店舗の条件を変更すると表示されることがあります。"
        errorTitle={`${title}の取得に失敗しました`}
        skeleton={<ActivityTableSkeleton />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 text-xs font-semibold">利用者</TableHead>
              <TableHead className="px-3 text-xs font-semibold">種別</TableHead>
              <TableHead className="px-3 text-xs font-semibold">時刻</TableHead>
              <TableHead className="px-3 text-xs font-semibold">ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const time = formatTime(row.occurred_at);
              const genderClass =
                row.gender === 'male'
                  ? 'text-gender-male'
                  : row.gender === 'female'
                    ? 'text-gender-female'
                    : 'text-muted-foreground';
              const genderSymbol = row.gender === 'male' ? '♂' : row.gender === 'female' ? '♀' : '';

              return (
                <TableRow
                  key={row.log_id}
                  className={cn(
                    'last:border-b!',
                    onSelectRow && 'hover:bg-muted/50 cursor-pointer',
                  )}
                  onClick={() => onSelectRow?.(row.log_id)}
                >
                  <TableCell className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex shrink-0 items-center gap-1">
                        <Avatar size="lg">
                          <AvatarImage src={row.avatar_url ?? undefined} alt={row.name} />
                          <AvatarFallback>{row.name.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        {genderSymbol && (
                          <span className={`text-xs font-medium ${genderClass}`}>
                            {genderSymbol}
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="text-xs font-medium">{row.name}</p>
                        <p className="text-2xs text-muted-foreground">{row.furigana}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[160px] px-3 py-2 whitespace-normal">
                    <p className="line-clamp-2 text-xs leading-tight" title={row.contract_name}>
                      {row.contract_name}
                    </p>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <p className="text-xs tabular-nums">{time}</p>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {row.frequency_badge || row.companion_role ? (
                      <div className="flex flex-wrap gap-1">
                        {row.companion_role && <CompanionBadge role={row.companion_role} />}
                        {row.frequency_badge && <FrequencyBadge type={row.frequency_badge} />}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">---</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DataStateBoundary>
    </Card>
  );
}
