'use client';

import { AccessSettingsCard } from './access-settings-card';
import { EntryExitTable } from './entry-exit-table';
import { LessonTable } from './lesson-table';

interface UsageHistoryTabProps {
  readonly memberId: string;
}

export function UsageHistoryTab(props: UsageHistoryTabProps) {
  const { memberId } = props;
  return (
    <div className="flex gap-4">
      {/* Left Column: Entry/Exit & Lesson Tables */}
      <div className="flex w-[60%] flex-col gap-4">
        <EntryExitTable memberId={memberId} />

        <LessonTable memberId={memberId} />
      </div>

      {/* Right Column: Access Settings Card */}
      <div className="w-[40%]">
        <AccessSettingsCard memberId={memberId} />
      </div>
    </div>
  );
}
