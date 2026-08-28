import type {
  BlacklistDetail,
  BlacklistListItem,
  CreateBlacklistBody,
} from '@/app/api/_schemas/blacklist.schema';

import type {
  BlacklistListFilters,
  CreateBlacklistResult,
  ReleaseBlacklistResult,
} from '../tables/blacklist.table';

/**
 * A-01 FR-015 ブラックリスト table (v0.4 contract shape).
 *
 * Two writers, deliberately separate:
 * - `create` is the operator path (the list Sheet and the member-detail dialog). It
 *   only ever writes `source: 'manual'` — the registration path is never taken from
 *   the caller (FR-049).
 * - `createAuto` is the forced-withdrawal batch's path (A-01 FR-016). It is the only
 *   writer of `source: 'forced_withdrawal'`, its actor is System, and the contract
 *   fixes its reason categories to exactly `['unpaid']`.
 *
 * `release` flips `is_active` and stamps who/when — the row is never deleted, so a
 * released entry stays readable by its own URL (FR-065, FR-069a).
 */
export type MemberBlacklistType = {
  _rows: BlacklistDetail[];
  _seeded: boolean;
  _seed(): void;
  all(): BlacklistDetail[];
  list(filters: BlacklistListFilters): BlacklistListItem[];
  /** FR-025 — the filter banner's denominator; `is_active` still applies. */
  countBaseline(filters: BlacklistListFilters): number;
  getById(id: string): BlacklistDetail | undefined;
  /** Backs the Sheet's pre-submit duplicate check (FR-050a). */
  hasActiveForMember(memberId: string): boolean;
  create(memberId: string, body: CreateBlacklistBody): CreateBlacklistResult;
  createAuto(memberId: string): BlacklistDetail | undefined;
  release(id: string): ReleaseBlacklistResult;
};
