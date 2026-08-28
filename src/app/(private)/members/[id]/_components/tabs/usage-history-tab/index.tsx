'use client';

import { EntryExitTable } from './entry-exit-table';
import { LessonTable } from './lesson-table';
import { OptionUsageCard } from './option-usage-card';
import { UsageStatusCard } from './usage-status-card';

interface UsageHistoryTabProps {
  readonly memberId: string;
}

export function UsageHistoryTab(props: UsageHistoryTabProps) {
  const { memberId } = props;
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Left Column (60%): Entry/Exit, Lesson & Option Usage Tables */}
      <div className="flex w-full flex-col gap-4 md:w-[60%]">
        <EntryExitTable memberId={memberId} />

        <LessonTable memberId={memberId} />

        <OptionUsageCard memberId={memberId} />
      </div>

      {/* Right Column (40%): Usage Status */}
      <div className="w-full md:w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <UsageStatusCard memberId={memberId} />
        </div>
      </div>
    </div>
  );
}
