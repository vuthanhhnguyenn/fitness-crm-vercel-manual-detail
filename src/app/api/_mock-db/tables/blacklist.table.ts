import type {
  BlacklistDetail,
  BlacklistListItem,
  CreateBlacklistBody,
} from '@/app/api/_schemas/blacklist.schema';

import type { DbType } from '../_db.types';
import { BLACKLIST_SYSTEM_STAFF, buildBlacklistSeed } from '../seeds/blacklist.seed';
import { DEFAULT_MEMBER_MAIN_CONTRACT, joinJapaneseName } from '../seeds/membership.seed';

/** Filters the list route applies. All optional except `is_active`, which defaults to true. */
export type BlacklistListFilters = {
  search?: string;
  source?: BlacklistDetail['source'];
  unpaid?: 'has_unpaid' | 'no_unpaid';
  is_active?: boolean;
};

/**
 * Registration outcome. The route maps `reason` onto the contract's status codes:
 * `member_not_found` → 404, `already_blacklisted` → 409.
 */
export type CreateBlacklistResult =
  | { ok: true; entry: BlacklistDetail }
  | { ok: false; reason: 'member_not_found' | 'already_blacklisted' };

/**
 * Release outcome. `not_found` → 404, `already_released` → 409.
 */
export type ReleaseBlacklistResult =
  | { ok: true; entry: BlacklistDetail }
  | { ok: false; reason: 'not_found' | 'already_released' };

/** The caller identity the mock stamps on writes. Replaced by the real JWT subject in Phase 2. */
const ACTING_STAFF = { staff_id: 'stf-001', display_name: '佐藤 花子' };

function toListItem(row: BlacklistDetail): BlacklistListItem {
  return {
    id: row.id,
    member_id: row.member_id,
    member_number: row.member_number,
    member_name: row.member_name,
    store_name: row.store_name,
    source: row.source,
    reason_categories: row.reason_categories,
    unpaid_amount: row.unpaid_amount,
    is_active: row.is_active,
    registered_at: row.registered_at,
  };
}

function matchesFilters(row: BlacklistDetail, f: BlacklistListFilters): boolean {
  // FR-033 — active-only unless explicitly asked otherwise. No screen asks.
  const wantActive = f.is_active ?? true;
  if (row.is_active !== wantActive) return false;

  if (f.source && row.source !== f.source) return false;

  if (f.unpaid === 'has_unpaid' && row.unpaid_amount <= 0) return false;
  if (f.unpaid === 'no_unpaid' && row.unpaid_amount > 0) return false;

  // FR-016 — evaluated here, over the whole filtered set, never client-side over one page.
  if (f.search) {
    const q = f.search.trim().toLowerCase();
    if (q) {
      const haystack = [row.member_number, row.member_name, row.member.name_kana ?? '']
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
  }

  return true;
}

export function createBlacklistTables(getDb: () => DbType) {
  return {
    memberBlacklist: {
      _rows: [] as BlacklistDetail[],
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().members._seed();
        this._rows = buildBlacklistSeed(getDb().members._members);
      },

      /** Every row, newest first. Callers filter. */
      all(): BlacklistDetail[] {
        this._seed();
        return this._rows;
      },

      list(filters: BlacklistListFilters): BlacklistListItem[] {
        this._seed();
        return this._rows.filter((r) => matchesFilters(r, filters)).map(toListItem);
      },

      /**
       * FR-025 — the banner's denominator: the count with every *optional* filter reset.
       * `is_active` is not optional in that sense — it has no screen control, so it stays
       * applied. Counting released rows here would print a total the operator can never
       * reach by any UI action.
       */
      countBaseline(filters: BlacklistListFilters): number {
        this._seed();
        const wantActive = filters.is_active ?? true;
        return this._rows.filter((r) => r.is_active === wantActive).length;
      },

      getById(id: string): BlacklistDetail | undefined {
        this._seed();
        // Released entries still resolve — release flips a flag, it never deletes (FR-069a).
        return this._rows.find((r) => r.id === id);
      },

      /** True when the member currently holds an active entry. Backs FR-050a's pre-check. */
      hasActiveForMember(memberId: string): boolean {
        this._seed();
        return this._rows.some((r) => r.member_id === memberId && r.is_active);
      },

      /**
       * Manual registration. `source` is never taken from the caller — every entry created
       * here is `manual`; `forced_withdrawal` is reachable only from `createAuto` (FR-049).
       *
       * Guards run in the contract's order: member missing → 404, active entry exists → 409.
       * Not idempotent — a second call while one is active fails rather than succeeding quietly.
       */
      create(memberId: string, body: CreateBlacklistBody): CreateBlacklistResult {
        this._seed();
        const db = getDb();
        const member = db.members.get(memberId);
        if (!member) return { ok: false, reason: 'member_not_found' };
        if (this.hasActiveForMember(memberId)) {
          return { ok: false, reason: 'already_blacklisted' };
        }

        const now = new Date().toISOString();
        const kana = joinJapaneseName(
          member.personalInfo.lastNameKana ?? '',
          member.personalInfo.firstNameKana ?? '',
        ).trim();

        const entry: BlacklistDetail = {
          id: `bl-mn-${Date.now().toString(36)}`,
          member_id: member.memberId,
          member_number: member.memberNumber,
          member_name: joinJapaneseName(
            member.personalInfo.lastName,
            member.personalInfo.firstName,
          ),
          store_name: member.primaryStore?.name ?? null,
          source: 'manual',
          reason_categories: body.reason_categories,
          unpaid_amount: 0,
          is_active: true,
          registered_at: now,
          member: {
            member_id: member.memberId,
            member_number: member.memberNumber,
            name: joinJapaneseName(member.personalInfo.lastName, member.personalInfo.firstName),
            name_kana: kana || null,
            legacy_member_code: member.legacyMemberCode ?? null,
            member_type: member.memberType ?? null,
            contract_name: member.currentMainContract
              ? (member.contractName ?? DEFAULT_MEMBER_MAIN_CONTRACT)
              : null,
            store_name: member.primaryStore?.name ?? null,
            face_photo_url: member.personalInfo.facePhotoUrl ?? null,
          },
          memo: body.memo ?? null,
          level: body.level ?? null,
          registered_by: ACTING_STAFF,
          removed_at: null,
          removed_by: null,
          history: [
            { event: 'registered', occurred_at: now, actor: ACTING_STAFF, source: 'manual' },
          ],
        };

        this._rows.unshift(entry);

        /**
         * The member row carries a denormalised copy of its own active registration, and the
         * member detail gates 個人情報削除 / 再入会 on it. Kept in step **here** rather than in
         * the route so that every caller of this table agrees — `release` below does the
         * mirror of this, and the two only stay symmetric while they live side by side.
         */
        member.blacklist = {
          blacklistId: entry.id,
          isActive: true,
          reason: entry.reason_categories[0] ?? 'other',
          memo: entry.memo ?? undefined,
          registeredAt: entry.registered_at,
          registeredBy: {
            staffId: entry.registered_by.staff_id,
            displayName: entry.registered_by.display_name,
          },
        };

        return { ok: true, entry };
      },

      /**
       * Auto-registration from the forced-withdrawal path (A-01 FR-016). Kept separate from
       * `create` because it is the only writer of `source: 'forced_withdrawal'`, its actor is
       * System, and the contract fixes its reason categories to exactly `['unpaid']`.
       *
       * Returns the existing entry untouched if the member already has one — the batch must
       * not create a duplicate, and it has no operator to report a 409 to.
       */
      createAuto(memberId: string): BlacklistDetail | undefined {
        this._seed();
        const existing = this._rows.find((r) => r.member_id === memberId && r.is_active);
        if (existing) return existing;

        const member = getDb().members.get(memberId);
        if (!member) return undefined;

        const now = new Date().toISOString();
        const kana = joinJapaneseName(
          member.personalInfo.lastNameKana ?? '',
          member.personalInfo.firstNameKana ?? '',
        ).trim();

        const entry: BlacklistDetail = {
          id: `bl-fw-${Date.now().toString(36)}`,
          member_id: member.memberId,
          member_number: member.memberNumber,
          member_name: joinJapaneseName(
            member.personalInfo.lastName,
            member.personalInfo.firstName,
          ),
          store_name: member.primaryStore?.name ?? null,
          source: 'forced_withdrawal',
          reason_categories: ['unpaid'],
          unpaid_amount: 0,
          is_active: true,
          registered_at: now,
          member: {
            member_id: member.memberId,
            member_number: member.memberNumber,
            name: joinJapaneseName(member.personalInfo.lastName, member.personalInfo.firstName),
            name_kana: kana || null,
            legacy_member_code: member.legacyMemberCode ?? null,
            member_type: member.memberType ?? null,
            contract_name: member.currentMainContract
              ? (member.contractName ?? DEFAULT_MEMBER_MAIN_CONTRACT)
              : null,
            store_name: member.primaryStore?.name ?? null,
            face_photo_url: member.personalInfo.facePhotoUrl ?? null,
          },
          memo: null,
          level: null,
          registered_by: BLACKLIST_SYSTEM_STAFF,
          removed_at: null,
          removed_by: null,
          // actor is null for system-generated events, per the contract.
          history: [
            { event: 'registered', occurred_at: now, actor: null, source: 'forced_withdrawal' },
          ],
        };

        this._rows.unshift(entry);
        return entry;
      },

      /**
       * Release (FR-062 – FR-068). The row is kept and `is_active` flipped, so the entry stays
       * auditable — there is no physical delete.
       *
       * `members.member_status` is deliberately untouched (FR-066): releasing a force-withdrawn
       * member means "this person may enrol again", not "the withdrawal is undone".
       */
      release(id: string): ReleaseBlacklistResult {
        this._seed();
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return { ok: false, reason: 'not_found' };

        const row = this._rows[idx]!;
        if (!row.is_active) return { ok: false, reason: 'already_released' };

        const now = new Date().toISOString();
        const updated: BlacklistDetail = {
          ...row,
          is_active: false,
          removed_at: now,
          removed_by: ACTING_STAFF,
          history: [
            ...row.history,
            { event: 'removed', occurred_at: now, actor: ACTING_STAFF, source: row.source },
          ],
        };
        this._rows[idx] = updated;

        /**
         * FR-066 — the member's denormalised copy has to follow the release, or the member
         * detail goes on blocking 個人情報削除 / 再入会 for someone who is no longer listed.
         * The flag is **flipped, not nulled**, mirroring the row itself: release never deletes,
         * so who registered the member and when stays readable.
         *
         * Guarded on `isActive` because the one-active-row invariant means the member's flag
         * can only ever describe the entry being released here.
         */
        const member = getDb().members.get(row.member_id);
        if (member?.blacklist?.isActive) {
          member.blacklist = { ...member.blacklist, isActive: false };
        }

        return { ok: true, entry: updated };
      },
    },
  };
}
