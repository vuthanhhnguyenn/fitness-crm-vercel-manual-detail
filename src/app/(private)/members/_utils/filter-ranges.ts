import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';

/**
 * The 入会期間 / 最終来館日 filters are relative presets on screen but absolute date
 * bounds on the wire: the API takes `enrolled_from`/`enrolled_to` and
 * `last_entry_from`/`last_entry_to` only, and expands nothing on its own
 * (backend design answer 2026-08-10, QA01 §2.3). These helpers do that expansion.
 */

const toApiDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export type EnrolledRange = { enrolled_from?: string; enrolled_to?: string };

/** 入会期間: 今月 / 先月 / 今年 / 昨年 → an inclusive [from, to] join-date window. */
export function joinPeriodToRange(preset: string | null, today: Date = new Date()): EnrolledRange {
  switch (preset) {
    case 'this_month':
      return {
        enrolled_from: toApiDate(startOfMonth(today)),
        enrolled_to: toApiDate(endOfMonth(today)),
      };
    case 'last_month': {
      const lastMonth = subMonths(today, 1);
      return {
        enrolled_from: toApiDate(startOfMonth(lastMonth)),
        enrolled_to: toApiDate(endOfMonth(lastMonth)),
      };
    }
    case 'this_year':
      return {
        enrolled_from: toApiDate(startOfYear(today)),
        enrolled_to: toApiDate(endOfYear(today)),
      };
    case 'last_year': {
      const lastYear = subYears(today, 1);
      return {
        enrolled_from: toApiDate(startOfYear(lastYear)),
        enrolled_to: toApiDate(endOfYear(lastYear)),
      };
    }
    default:
      return {};
  }
}

export type LastEntryRange = {
  last_entry_from?: string;
  last_entry_to?: string;
  include_never_entered?: boolean;
};

/**
 * 最終来館日 presets → last-entry bounds.
 *
 * The two 「…来館なし」 buckets MUST also send `include_never_entered`, otherwise
 * members who have never entered — the highest churn risk the filter exists to
 * surface — are silently dropped.
 */
export function lastVisitToRange(preset: string | null, today: Date = new Date()): LastEntryRange {
  switch (preset) {
    case 'within_1w':
      return { last_entry_from: toApiDate(subDays(today, 7)) };
    case 'within_2w':
      return { last_entry_from: toApiDate(subDays(today, 14)) };
    case 'over_3w':
      return { last_entry_to: toApiDate(subDays(today, 21)), include_never_entered: true };
    case 'over_1m':
      return { last_entry_to: toApiDate(subMonths(today, 1)), include_never_entered: true };
    default:
      return {};
  }
}
