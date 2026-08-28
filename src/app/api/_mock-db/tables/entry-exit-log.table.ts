import type {
  ActivityRow,
  AuthMethod,
  EntryExitDirection,
  EntryExitResult,
  HistorySortBy,
  HistoryVisitRow,
  HourlyEntryCount,
  MemberQuickView,
  QuickViewContext,
  RecentVisit,
  VisitStatus,
} from '@/app/api/_schemas/entry-exit-log.schema';

import type { DbType } from '../_db.types';
import { buildEntryExitLogSeed } from '../seeds/entry-exit-log.seed';
import type { EntryExitLogRow, EntryExitLogsType } from '../types/entry-exit-logs.type';

const HOUR_RANGE = { start: 6, end: 22 };

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayDateKey(): string {
  return toLocalDateKey(new Date().toISOString());
}

function isWithinStoreScope(storeId: string, storeIds: string[] | null): boolean {
  if (storeIds === null) return true;
  return storeIds.includes(storeId);
}

export function createEntryExitLogTables(getDb: () => DbType) {
  return {
    entryExitLogs: {
      _rows: [] as EntryExitLogRow[],
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = buildEntryExitLogSeed(getDb());
      },

      listByDirection(params: {
        direction: EntryExitDirection;
        limit: number;
        date: string;
        storeIds: string[] | null;
      }): ActivityRow[] {
        this._seed();
        const dateKey = params.date || todayDateKey();

        return this._rows
          .filter(
            (row) =>
              row.direction === params.direction &&
              toLocalDateKey(row.occurred_at) === dateKey &&
              isWithinStoreScope(row.store_id, params.storeIds),
          )
          .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
          .slice(0, params.limit)
          .map((row) => toActivityRow(getDb(), this._rows, row));
      },

      getHourlySummary(params: { date: string; storeIds: string[] | null }): HourlyEntryCount[] {
        this._seed();
        const dateKey = params.date || todayDateKey();

        const buckets = new Map<number, number>();
        for (let hour = HOUR_RANGE.start; hour <= HOUR_RANGE.end; hour++) {
          buckets.set(hour, 0);
        }

        this._rows
          .filter(
            (row) =>
              row.direction === 'entry' &&
              toLocalDateKey(row.occurred_at) === dateKey &&
              isWithinStoreScope(row.store_id, params.storeIds),
          )
          .forEach((row) => {
            const hour = new Date(row.occurred_at).getHours();
            if (buckets.has(hour)) {
              buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
            }
          });

        return Array.from(buckets.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([hour, count]) => ({ hour, count }));
      },

      getQuickView(logId: string, storeIds: string[] | null): MemberQuickView | undefined {
        this._seed();
        const row = this._rows.find(
          (r) => r.id === logId && isWithinStoreScope(r.store_id, storeIds),
        );
        if (!row) return undefined;

        const db = getDb();
        const display = resolveMemberDisplay(db, row.member_id);
        if (!display) return undefined;

        const recentVisits = buildRecentVisits(db, this._rows, row.member_id, row.id);

        // B-01-01 (history) passes an entry-direction row's id for in-progress/denied
        // visits, which this endpoint's original 'entry'/'exit' vocabulary can't
        // distinguish from a plain "just entered" event (research.md R7).
        const hasLaterExit =
          row.direction === 'entry' &&
          this._rows.some(
            (candidate) =>
              candidate.direction === 'exit' &&
              candidate.member_id === row.member_id &&
              candidate.store_id === row.store_id &&
              candidate.occurred_at > row.occurred_at,
          );
        const context: QuickViewContext =
          row.direction === 'entry' && row.result === 'denied'
            ? 'denied'
            : row.direction === 'entry' && !hasLaterExit
              ? 'in-building'
              : row.direction;

        return {
          member_id: row.member_id,
          name: display.name,
          furigana: display.furigana,
          gender: display.gender,
          avatar_url: display.avatarUrl,
          context,
          occurred_at: row.occurred_at,
          contract_name: display.contractName,
          contract_id: display.contractId,
          frequency_badge: row.frequency_badge,
          companion_role: row.companion_role,
          phone: display.phone,
          email: display.email,
          recent_visits: recentVisits,
        };
      },

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
      }): { rows: HistoryVisitRow[]; total: number } {
        this._seed();
        const db = getDb();

        const visits = pairVisits(db, this._rows, params.storeIds);
        const filtered = visits.filter((visit) =>
          matchesHistoryFilters(visit, {
            search: params.search,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            authMethod: params.authMethod,
            result: params.result,
          }),
        );
        const sorted = sortHistoryVisits(filtered, params.sortBy, params.sortOrder);

        if (params.page === undefined || params.limit === undefined) {
          return { rows: sorted, total: sorted.length };
        }

        const start = (params.page - 1) * params.limit;
        return { rows: sorted.slice(start, start + params.limit), total: sorted.length };
      },
    } satisfies EntryExitLogsType,
  };
}

// ─── Join helpers ────────────────────────────────────────────────────────────

function resolveMemberDisplay(db: DbType, memberId: string) {
  const listItem = db.members.getList().find((m) => m.id === memberId);
  if (!listItem) return null;
  const detail = db.members.get(memberId);

  return {
    name: listItem.name_kanji,
    furigana: listItem.name_kana,
    gender: detail?.personalInfo.gender ?? 'other',
    // No photo/avatar field exists on GetMemberDetailResponse in this app —
    // AvatarFallback (FR-B01-17) is always exercised, never a positive-path image.
    avatarUrl: null as string | null,
    contractName: listItem.contract_name,
    contractId: listItem.contract_id,
    phone: detail?.personalInfo.phone ?? null,
    email: detail?.personalInfo.email ?? null,
  };
}

function priorVisitCount(rows: EntryExitLogRow[], memberId: string, beforeIso: string): number {
  return rows.filter(
    (r) => r.member_id === memberId && r.direction === 'exit' && r.occurred_at < beforeIso,
  ).length;
}

function toActivityRow(db: DbType, allRows: EntryExitLogRow[], row: EntryExitLogRow): ActivityRow {
  const display = resolveMemberDisplay(db, row.member_id);

  return {
    log_id: row.id,
    member_id: row.member_id,
    name: display?.name ?? '不明な会員',
    furigana: display?.furigana ?? '',
    gender: display?.gender ?? 'other',
    avatar_url: display?.avatarUrl ?? null,
    contract_name: display?.contractName ?? '—',
    contract_id: display?.contractId ?? '—',
    occurred_at: row.occurred_at,
    gate: row.gate,
    frequency_badge: row.frequency_badge,
    companion_role: row.companion_role,
    visit_count: priorVisitCount(allRows, row.member_id, row.occurred_at),
  };
}

/** Pairs a member's most recent exits with a same-day preceding entry to compute stay duration. */
function buildRecentVisits(
  db: DbType,
  allRows: EntryExitLogRow[],
  memberId: string,
  excludeLogId: string,
): RecentVisit[] {
  const storeNameById = new Map(db.stores.getList().map((s) => [s.id, s.name]));

  return allRows
    .filter((r) => r.member_id === memberId && r.direction === 'exit' && r.id !== excludeLogId)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 3)
    .map((exitRow) => {
      const sameDayEntries = allRows.filter(
        (r) =>
          r.member_id === memberId &&
          r.direction === 'entry' &&
          toLocalDateKey(r.occurred_at) === toLocalDateKey(exitRow.occurred_at) &&
          r.occurred_at < exitRow.occurred_at,
      );
      const matchedEntry = sameDayEntries.sort((a, b) =>
        b.occurred_at.localeCompare(a.occurred_at),
      )[0];

      const durationMinutes = matchedEntry
        ? Math.round(
            (new Date(exitRow.occurred_at).getTime() -
              new Date(matchedEntry.occurred_at).getTime()) /
              60000,
          )
        : null;

      return {
        exit_occurred_at: exitRow.occurred_at,
        duration_minutes: durationMinutes,
        store_name: storeNameById.get(exitRow.store_id) ?? '—',
      };
    });
}

/**
 * Pairs each member's `entry` rows with their nearest following, not-yet-claimed
 * `exit` row at the same store — producing one `HistoryVisitRow` per visit
 * (completed, in-progress, or denied) instead of one row per raw event (B-01-01).
 */
function pairVisits(
  db: DbType,
  allRows: EntryExitLogRow[],
  storeIds: string[] | null,
): HistoryVisitRow[] {
  const rowsByMember = new Map<string, EntryExitLogRow[]>();
  for (const row of allRows) {
    const list = rowsByMember.get(row.member_id) ?? [];
    list.push(row);
    rowsByMember.set(row.member_id, list);
  }

  const storeNameById = new Map(db.stores.getList().map((s) => [s.id, s.name]));
  const memberById = new Map(db.members.getList().map((m) => [m.id, m]));

  const visits: HistoryVisitRow[] = [];

  for (const [memberId, memberRows] of rowsByMember) {
    const sorted = [...memberRows].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
    const usedExitIds = new Set<string>();

    for (const row of sorted) {
      if (row.direction !== 'entry') continue;
      if (!isWithinStoreScope(row.store_id, storeIds)) continue;

      const matchedExit =
        row.result === 'denied'
          ? undefined
          : sorted.find(
              (candidate) =>
                candidate.direction === 'exit' &&
                candidate.store_id === row.store_id &&
                candidate.occurred_at > row.occurred_at &&
                !usedExitIds.has(candidate.id),
            );
      if (matchedExit) usedExitIds.add(matchedExit.id);

      const display = resolveMemberDisplay(db, memberId);
      const homeStore = memberById.get(memberId);
      const visitStatus: VisitStatus =
        row.result === 'denied' ? 'denied' : matchedExit ? 'completed' : 'in_progress';
      const stayDurationMinutes = matchedExit
        ? Math.round(
            (new Date(matchedExit.occurred_at).getTime() - new Date(row.occurred_at).getTime()) /
              60000,
          )
        : null;

      visits.push({
        entry_log_id: row.id,
        exit_log_id: matchedExit?.id ?? null,
        member_id: memberId,
        name: display?.name ?? '不明な会員',
        furigana: display?.furigana ?? '',
        gender: display?.gender ?? 'other',
        avatar_url: display?.avatarUrl ?? null,
        contract_name: display?.contractName ?? '—',
        contract_id: display?.contractId ?? '—',
        visit_date: toLocalDateKey(row.occurred_at),
        entry_time: row.occurred_at,
        exit_time: matchedExit?.occurred_at ?? null,
        stay_duration_minutes: stayDurationMinutes,
        visit_status: visitStatus,
        home_store_id: homeStore?.store_id ?? '—',
        home_store_name: homeStore?.store_name ?? '—',
        visit_store_id: row.store_id,
        visit_store_name: storeNameById.get(row.store_id) ?? '—',
        auth_method: row.auth_method,
        result: row.result,
      });
    }
  }

  return visits;
}

function matchesHistoryFilters(
  visit: HistoryVisitRow,
  filters: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    authMethod?: AuthMethod;
    result?: EntryExitResult;
  },
): boolean {
  if (filters.dateFrom && visit.visit_date < filters.dateFrom) return false;
  if (filters.dateTo && visit.visit_date > filters.dateTo) return false;
  if (filters.authMethod && visit.auth_method !== filters.authMethod) return false;
  if (filters.result && visit.result !== filters.result) return false;

  if (filters.search) {
    const query = filters.search.toLowerCase();
    const haystack = `${visit.name} ${visit.furigana} ${visit.member_id}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  return true;
}

function sortHistoryVisits(
  rows: HistoryVisitRow[],
  sortBy: HistorySortBy,
  sortOrder: 'asc' | 'desc',
): HistoryVisitRow[] {
  const dir = sortOrder === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * dir;
      case 'entry_time':
        return a.entry_time.localeCompare(b.entry_time) * dir;
      case 'exit_time':
        return (a.exit_time ?? '').localeCompare(b.exit_time ?? '') * dir;
      case 'contract_name':
        return a.contract_name.localeCompare(b.contract_name) * dir;
      case 'visit_date':
      default:
        return a.visit_date === b.visit_date
          ? a.entry_time.localeCompare(b.entry_time) * dir
          : a.visit_date.localeCompare(b.visit_date) * dir;
    }
  });
}
