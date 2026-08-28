import type {
  ActivityRow,
  AuthMethod,
  EntryExitDirection,
  EntryExitResult,
  HistorySortBy,
  HistoryVisitRow,
  HourlyEntryCount,
  MemberQuickView,
} from '@/app/api/_schemas/entry-exit-log.schema';

export type EntryExitLogRow = {
  id: string;
  member_id: string;
  store_id: string;
  direction: EntryExitDirection;
  occurred_at: string;
  gate: string;
  frequency_badge: 'regular' | 'longAbsence' | null;
  companion_role: 'inviter' | 'invitee' | null;
  auth_method: AuthMethod;
  /** Only `direction: 'entry'` rows may be `'denied'`; `'exit'` rows are always `'success'`. */
  result: EntryExitResult;
};

export type EntryExitLogsType = {
  _rows: EntryExitLogRow[];
  _seeded: boolean;
  _seed(): void;
  listByDirection(params: {
    direction: EntryExitDirection;
    limit: number;
    date: string;
    storeIds: string[] | null;
  }): ActivityRow[];
  getHourlySummary(params: { date: string; storeIds: string[] | null }): HourlyEntryCount[];
  getQuickView(logId: string, storeIds: string[] | null): MemberQuickView | undefined;
  /**
   * Paired-visit history for B-01-01. When `page`/`limit` are omitted, returns every
   * matching row unpaginated (used by the CSV export route) — otherwise paginates.
   */
  listHistory(params: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    storeIds: string[] | null;
    authMethod?: AuthMethod;
    result?: EntryExitResult;
    sortBy: HistorySortBy;
    sortOrder: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): { rows: HistoryVisitRow[]; total: number };
};
