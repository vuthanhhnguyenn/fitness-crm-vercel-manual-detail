'use client';

import { useState } from 'react';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { formatDate } from '@/utils/format.util';
import { isBefore, parseISO, startOfDay } from 'date-fns';

import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useEntryExitFilters } from '../_hooks/use-entry-exit-filters.hook';
import { ActivityTable } from './activity-table';
import { EntryExitHeaderControls } from './entry-exit-header-controls';
import { HourlyEntryChart } from './hourly-entry-chart';
import { MemberQuickViewSheet } from './member-quick-view-sheet';

export function EntryExitSection() {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const { date, storeOverride, setDate, setStoreOverride } = useEntryExitFilters();
  const { currentStoreId, isLoading: isStoreScopeLoading } = useCurrentStore();

  // Header scope wins when it's a specific store; when the header is "全店舗", the
  // page-local narrowing filter (if any) takes over. See entry-exit-header-controls.tsx.
  const effectiveStoreId = currentStoreId === ALL_STORES ? storeOverride : currentStoreId;

  // Wait for the restricted-role store scope to resolve before fetching — otherwise
  // these queries fire once with the default "all" scope and again once the real
  // store id is known (see CurrentStoreProvider).
  const queriesEnabled = !isStoreScopeLoading;

  const isPastDate = isBefore(startOfDay(parseISO(date)), startOfDay(new Date()));

  return (
    <div className="flex flex-col">
      <PageHeader
        title="入退館"
        badge={
          isPastDate ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Badge
                      variant="outline"
                      className="bg-warning/10 text-warning border-warning/20 cursor-help text-xs font-semibold"
                    />
                  }
                >
                  履歴データ
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {formatDate(date)}の確定データです。リアルタイム更新は停止しています。
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : undefined
        }
        actions={
          <EntryExitHeaderControls
            date={date}
            storeOverride={storeOverride}
            onDateChange={setDate}
            onStoreOverrideChange={setStoreOverride}
          />
        }
      />

      <div className="flex flex-col gap-4 px-6 py-4">
        <HourlyEntryChart date={date} storeId={effectiveStoreId} enabled={queriesEnabled} />

        <div className="grid grid-cols-2 gap-4">
          <ActivityTable
            title="入館"
            direction="entry"
            date={date}
            storeId={effectiveStoreId}
            enabled={queriesEnabled}
            onSelectRow={setSelectedLogId}
          />
          <ActivityTable
            title="退館"
            direction="exit"
            date={date}
            storeId={effectiveStoreId}
            enabled={queriesEnabled}
            onSelectRow={setSelectedLogId}
          />
        </div>
      </div>

      <MemberQuickViewSheet
        logId={selectedLogId}
        onOpenChange={(open) => !open && setSelectedLogId(null)}
      />
    </div>
  );
}
