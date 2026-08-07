'use client';

import { parseAsStringEnum, useQueryState } from 'nuqs';

/**
 * D-02 FR-003 — URL state for the lesson content detail screen.
 * - `tab`: active tab (info / history). `history` is coerced to `info` when the
 *   current role cannot view history (mirrors the lockers detail tab guard).
 * - `from`: arrival context (`schedule`) — drives the back link target (FR-003-P1-19).
 */

export type LessonDetailTab = 'info' | 'history';
export type LessonDetailFrom = 'schedule';

const TAB_VALUES: LessonDetailTab[] = ['info', 'history'];
const FROM_VALUES: LessonDetailFrom[] = ['schedule'];

export function useLessonDetailNav(canViewHistory: boolean) {
  const [rawTab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum<LessonDetailTab>(TAB_VALUES).withDefault('info'),
  );
  const [from] = useQueryState('from', parseAsStringEnum<LessonDetailFrom>(FROM_VALUES));

  const tab: LessonDetailTab = rawTab === 'history' && !canViewHistory ? 'info' : rawTab;

  return {
    tab,
    setTab,
    from,
    isFromSchedule: from === 'schedule',
  };
}
