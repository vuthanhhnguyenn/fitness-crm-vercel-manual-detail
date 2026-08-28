import type {
  CancellationBlockedReason,
  LeaveDetail,
  LeaveListItem,
  LeaveMember,
  ProxyAgreementMethod,
  SuspensionHistoryMonth,
  SuspensionHistoryStatus,
} from '@/app/api/_schemas/leave.schema';
import { formatDateYYYYMM, formatDateYYYYMMDD, formatISODateLocal } from '@/utils/date.util';
import { addDays, addMonths, parse } from 'date-fns';

import { MemberStatus } from '@/lib/api/types.gen';

import type { MemberRow } from './membership.seed';

/**
 * A-03 休会・退会 seed.
 *
 * Rows are **derived** from the member table rather than declared statically, so a
 * member's status and their leave record can never disagree — `members.table.ts`
 * writes member status back through `_updateDetail`, and the member detail screen
 * reads `getActiveSuspensionByMemberId`. A static seed would drift from both.
 *
 * Deterministic coverage overrides are layered on top so the quickstart checklist
 * is exercisable (see `specs/024-leave-withdrawal-management/data-model.md`).
 */

const MEMBER_STATUSES_WITH_LEAVE = new Set<string>([
  MemberStatus.SUSPENDED,
  MemberStatus.PENDING_WITHDRAWAL,
  MemberStatus.WITHDRAWN,
  MemberStatus.FORCED_WITHDRAWAL,
]);

const REASONS = [
  '海外出張のため',
  '体調不良のため',
  '育児のため',
  '経済的理由のため',
  '転居のため',
] as const;

const CONSENT_METHODS: ProxyAgreementMethod[] = ['in_person', 'phone', 'email', 'line'];

const SEED_BASE_DATE = new Date('2026-01-01');

// ─── Date helpers ────────────────────────────────────────────────────────────

/** The "YYYY/MM" key the history strip is indexed by. */
const MONTH_KEY_FORMAT = 'yyyy/MM';

function addMonthsToJpMonth(yearMonth: string, delta: number): string {
  return formatDateYYYYMM(addMonths(parse(yearMonth, MONTH_KEY_FORMAT, new Date()), delta));
}

export function buildApplicationNumber(index: number): string {
  return String(index + 1).padStart(10, '0');
}

// ─── Coverage plan ───────────────────────────────────────────────────────────

/**
 * Forces the first four derived rows onto one of each list status, and pins the
 * cancellability of the withdrawal rows so every guard branch is reachable:
 * index 1 cancellable, index 5 blocked by `usage_started`, index 3 blocked by
 * `batch_processing_started` (its status is withdrawal_pending).
 */
type CoverageEntry = {
  type: LeaveListItem['type'];
  status: LeaveListItem['status'];
  usageStartOffsetDays: number | null;
};

const COVERAGE_PLAN: CoverageEntry[] = [
  { type: 'suspension', status: 'suspension_scheduled', usageStartOffsetDays: null },
  { type: 'withdrawal', status: 'withdrawal_scheduled', usageStartOffsetDays: 3650 },
  { type: 'suspension', status: 'suspended', usageStartOffsetDays: null },
  { type: 'withdrawal', status: 'withdrawal_pending', usageStartOffsetDays: 3650 },
  { type: 'suspension', status: 'suspended', usageStartOffsetDays: null },
  { type: 'withdrawal', status: 'withdrawal_scheduled', usageStartOffsetDays: -3650 },
];

function planFor(index: number): CoverageEntry {
  return COVERAGE_PLAN[index % COVERAGE_PLAN.length]!;
}

// ─── Cancellability (mirrors the guard chain in the route handler) ───────────

export function deriveCancellability(
  type: LeaveListItem['type'],
  status: LeaveDetail['status'],
  usageStartDate: string | null,
  today: Date = new Date(),
): { cancellable: boolean; cancellation_blocked_reason: CancellationBlockedReason | null } {
  // Guard order mirrors the route handler. In this mock the application lifecycle
  // and the member state are merged into one `status`, so `withdrawal_pending`
  // stands in for "the withdrawal batch owns the row".
  if (status === 'withdrawal_pending') {
    return { cancellable: false, cancellation_blocked_reason: 'batch_processing_started' };
  }
  if (type !== 'withdrawal' || status !== 'withdrawal_scheduled') {
    return { cancellable: false, cancellation_blocked_reason: 'not_cancellable_status' };
  }
  if (usageStartDate !== null && new Date(usageStartDate) <= today) {
    return { cancellable: false, cancellation_blocked_reason: 'usage_started' };
  }
  return { cancellable: true, cancellation_blocked_reason: null };
}

// ─── Suspension history (derived projection over a member's own rows) ────────

/**
 * Display precedence when two of a member's applications land on the same month. The strip
 * shows one cell per month, so a collision has to resolve to the strongest state rather than
 * to whichever row happened to be walked last: a withdrawal outranks a suspension, and a
 * suspension already in force outranks one that is merely scheduled.
 */
const HISTORY_STATUS_PRIORITY: Record<SuspensionHistoryStatus, number> = {
  'pending-retire': 3,
  active: 2,
  'pending-leave': 1,
};

export function deriveSuspensionHistory(
  rowsForMember: {
    type: LeaveListItem['type'];
    status: LeaveListItem['status'];
    scheduled_date: string;
    end_date: string | null;
    application_number: string;
  }[],
): SuspensionHistoryMonth[] {
  const byMonth = new Map<string, SuspensionHistoryMonth>();

  const put = (month: SuspensionHistoryMonth) => {
    const held = byMonth.get(month.year_month);
    if (!held || HISTORY_STATUS_PRIORITY[month.status] > HISTORY_STATUS_PRIORITY[held.status]) {
      byMonth.set(month.year_month, month);
    }
  };

  for (const row of rowsForMember) {
    const startMonth = row.scheduled_date.slice(0, 7);

    if (row.type === 'withdrawal') {
      put({
        year_month: startMonth,
        status: 'pending-retire',
        application_number: row.application_number,
      });
      continue;
    }

    const endMonth = row.end_date ?? startMonth;
    const status = row.status === 'suspended' ? 'active' : 'pending-leave';
    let cursor = startMonth;
    // Bounded walk — suspensions never span more than a couple of years in seed data
    for (let guard = 0; guard < 36 && cursor <= endMonth; guard += 1) {
      put({ year_month: cursor, status, application_number: row.application_number });
      cursor = addMonthsToJpMonth(cursor, 1);
    }
  }

  return [...byMonth.values()].sort((a, b) => a.year_month.localeCompare(b.year_month));
}

// ─── Member block projection ─────────────────────────────────────────────────

/** `MemberRow` is the generated detail response — flat camelCase, names split into parts. */
export function memberFullName(member: MemberRow): string {
  return `${member.personalInfo.lastName} ${member.personalInfo.firstName}`;
}

function memberFullNameKana(member: MemberRow): string | null {
  const { lastNameKana, firstNameKana } = member.personalInfo;
  if (!lastNameKana && !firstNameKana) return null;
  return `${lastNameKana ?? ''} ${firstNameKana ?? ''}`.trim();
}

export function toLeaveMember(member: MemberRow): LeaveMember {
  return {
    member_id: member.memberId,
    member_number: member.memberNumber,
    name: memberFullName(member),
    name_kana: memberFullNameKana(member),
    legacy_member_code: member.legacyMemberCode ?? null,
    member_type: member.memberType,
    // The member row carries the main contract's display name, so the 主契約 badge
    // resolves without a second lookup (FR-057a).
    contract_name: member.contractName ?? null,
    store_name: member.primaryStore.name,
    face_photo_url: member.personalInfo.facePhotoUrl ?? null,
  };
}

// ─── Test fixtures ───────────────────────────────────────────────────────────

/**
 * States the derived block above cannot produce, appended so the A-03 test cases that
 * depend on them stop being unexercisable (see the Blocked list in
 * `specs/024-leave-withdrawal-management/tests/cases/`). Each entry says which case it
 * feeds; none of them replaces or renumbers a derived row.
 */
type FixtureSpec = {
  /** Suffix appended to the id/application-number sequence, for readability in logs. */
  label: string;
  type: LeaveListItem['type'];
  /** Lifecycle status. `completed` never reaches the list — it is a detail-only state. */
  status: LeaveDetail['status'];
  /** Offset applied to the member index so a fixture can reuse an already-seeded member. */
  memberOffset?: number;
  /** Pins the fixture to one specific member — used by the hostile-name fixtures. */
  memberNumber?: string;
  reason?: string;
  withdrawalFee?: number | null;
  /** Excluded from the list when false — `completed` / `cancelled` are detail-only (Q-10). */
  inList: boolean;
};

/** ~1,000 characters, the textarea default cap, for the long-value layout check. */
const LONG_REASON = '長期の海外赴任に伴い当面の間ご利用が難しくなるためです。'
  .repeat(37)
  .slice(0, 1000);

/** Rendered as literal text by an escaping UI; never interpreted as markup. */
const MARKUP_REASON = '<script>alert(1)</script><img src=x onerror=alert(2)> 退会理由テスト';

const FIXTURES: FixtureSpec[] = [
  // 処理完了 — the closed state the list drops but the detail keeps (FR-055/076/079).
  { label: 'completed', type: 'withdrawal', status: 'completed', memberOffset: 0, inList: false },
  // A member holding a second, different-type application (spec Edge case "one member
  // holds several applications"): memberOffset 0 reuses the member behind lv-001, whose
  // derived row is a suspension.
  {
    label: 'second-app',
    type: 'withdrawal',
    status: 'withdrawal_scheduled',
    memberOffset: 0,
    inList: true,
  },
  // A withdrawal that carries no cancellation fee, so 関連情報 can show its empty `—`.
  {
    label: 'no-fee',
    type: 'withdrawal',
    status: 'withdrawal_scheduled',
    memberOffset: 1,
    withdrawalFee: null,
    inList: true,
  },
  // Long and hostile 理由 values for the layout and output-escaping checks.
  {
    label: 'long-reason',
    type: 'suspension',
    status: 'suspension_scheduled',
    memberOffset: 2,
    reason: LONG_REASON,
    inList: true,
  },
  {
    label: 'markup-reason',
    type: 'suspension',
    status: 'suspension_scheduled',
    memberOffset: 3,
    reason: MARKUP_REASON,
    inList: true,
  },
  /*
   * The two hostile-name members (see `members.table.ts`) also get a **cancellable**
   * withdrawal pinned to them. Their derived row takes whatever the coverage plan hands
   * out, which is not necessarily a cancellable withdrawal, and without one the row-action
   * menu stays disabled — so the over-long and markup-bearing names would never reach the
   * confirmation dialog, the narrowest surface they have to survive.
   */
  {
    label: 'long-name-cancellable',
    type: 'withdrawal',
    status: 'withdrawal_scheduled',
    memberNumber: 'M-00201',
    inList: true,
  },
  {
    label: 'markup-name-cancellable',
    type: 'withdrawal',
    status: 'withdrawal_scheduled',
    memberNumber: 'M-00202',
    inList: true,
  },
];

/**
 * Extra withdrawal rows that only exist to push the list past seven pages, so the
 * pagination ellipsis becomes reachable at the 25-row default. They are withdrawal
 * states on purpose: `getActiveSuspensionByMemberId` only looks at suspensions, so
 * these cannot shadow a member's live suspension on the member-detail screen.
 */
const PAGINATION_FILLER_COUNT = 42;

// ─── Seed builder ────────────────────────────────────────────────────────────

export type LeaveSeedResult = {
  rows: LeaveListItem[];
  details: Record<string, LeaveDetail>;
};

export function buildLeaveSeed(members: MemberRow[]): LeaveSeedResult {
  const candidates = members.filter((m) => MEMBER_STATUSES_WITH_LEAVE.has(m.memberStatus));

  const rows: LeaveListItem[] = [];
  const details: Record<string, LeaveDetail> = {};

  // Pass 1 — build the list rows from the coverage plan.
  const staged = candidates.map((member, index) => {
    const plan = planFor(index);

    const appliedDate = addDays(SEED_BASE_DATE, index * 7);
    const scheduledDate = addDays(appliedDate, 14);

    const isSuspension = plan.type === 'suspension';
    const scheduledStr = isSuspension
      ? formatDateYYYYMM(scheduledDate)
      : formatDateYYYYMMDD(scheduledDate);

    const endDate = isSuspension ? formatDateYYYYMM(addMonths(scheduledDate, 2)) : null;

    // Local calendar date, not UTC — this value drives the `usage_started` guard.
    const usageStartDate =
      plan.usageStartOffsetDays === null
        ? null
        : formatISODateLocal(addDays(new Date(), plan.usageStartOffsetDays));

    const { cancellable, cancellation_blocked_reason } = deriveCancellability(
      plan.type,
      plan.status,
      usageStartDate,
    );

    const applicationNumber = buildApplicationNumber(index);
    const id = `lv-${String(index + 1).padStart(3, '0')}`;

    const row: LeaveListItem = {
      id,
      application_number: applicationNumber,
      member_id: member.memberId,
      member_number: member.memberNumber,
      member_name: memberFullName(member),
      brand: member.primaryStore.brandEnum,
      store_id: member.primaryStore.storeId,
      store_name: member.primaryStore.name,
      type: plan.type,
      status: plan.status,
      applied_at: formatDateYYYYMMDD(appliedDate),
      scheduled_date: scheduledStr,
      end_date: endDate,
      unpaid_amount: index % 5 === 0 ? 1100 * ((index % 3) + 1) : 0,
      cancellable,
      cancellation_blocked_reason,
    };

    rows.push(row);
    return { member, row, index, usageStartDate, appliedDate };
  });

  // Pass 2 — build details, now that every row exists (history needs the full set).
  for (const { member, row, index, usageStartDate, appliedDate } of staged) {
    const appliedAt = `${formatDateYYYYMMDD(appliedDate)} ${String(9 + (index % 8)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`;
    const isProxy = index % 3 === 0;
    const isSuspension = row.type === 'suspension';

    const memberRows = rows.filter((r) => r.member_id === row.member_id);

    details[row.id] = {
      id: row.id,
      application_number: row.application_number,
      member: toLeaveMember(member),
      brand: row.brand,
      store_id: row.store_id,
      store_name: row.store_name,
      type: row.type,
      status: row.status,
      applied_at: appliedAt,
      // Every application that reaches A-03 has already been approved on A-01-01
      // (A-03 L68-L70), so the approval instant exists from the moment it is seeded.
      approved_at: appliedAt,
      scheduled_date: row.scheduled_date,
      end_date: row.end_date,
      reason: REASONS[index % REASONS.length]!,
      applicant: `${row.member_name}（本人）`,
      is_proxy_applied: isProxy,
      proxy_applicant: isProxy ? `スタッフ${index + 1}（スタッフ）` : null,
      consent_at: isProxy
        ? `${formatDateYYYYMMDD(appliedDate)} ${String(9 + (index % 8)).padStart(2, '0')}:00`
        : null,
      consent_method: isProxy ? CONSENT_METHODS[index % CONSENT_METHODS.length]! : null,
      suspension_fee: isSuspension ? 1100 : null,
      withdrawal_fee: isSuspension ? null : 3300,
      applied_campaign: 'なし',
      unused_lessons: (index * 2) % 5,
      unpaid_amount: row.unpaid_amount,
      usage_start_date: usageStartDate,
      cancellable: row.cancellable,
      cancellation_blocked_reason: row.cancellation_blocked_reason,
      cancelled_by: null,
      cancelled_at: null,
      suspension_history: deriveSuspensionHistory(memberRows),
      created_at: appliedAt,
      updated_at: appliedAt,
    };
  }

  // Pass 3 — append the fixtures. `index` continues the derived sequence so ids and
  // application numbers stay contiguous and no derived record shifts.
  const appendRecord = (
    member: MemberRow,
    index: number,
    spec: Pick<FixtureSpec, 'type' | 'status' | 'inList'> &
      Partial<Pick<FixtureSpec, 'reason' | 'withdrawalFee'>>,
  ): void => {
    const appliedDate = addDays(SEED_BASE_DATE, index * 7);
    const scheduledDate = addDays(appliedDate, 14);
    const isSuspension = spec.type === 'suspension';

    const scheduledStr = isSuspension
      ? formatDateYYYYMM(scheduledDate)
      : formatDateYYYYMMDD(scheduledDate);
    const endDate = isSuspension ? formatDateYYYYMM(addMonths(scheduledDate, 2)) : null;

    // Cancellable withdrawals need a usage start date that has not arrived yet.
    const usageStartDate =
      spec.type === 'withdrawal' && spec.status === 'withdrawal_scheduled'
        ? formatISODateLocal(addDays(new Date(), 3650))
        : null;

    const { cancellable, cancellation_blocked_reason } = deriveCancellability(
      spec.type,
      spec.status,
      usageStartDate,
    );

    const id = `lv-${String(index + 1).padStart(3, '0')}`;
    const applicationNumber = buildApplicationNumber(index);
    const appliedAt = `${formatDateYYYYMMDD(appliedDate)} ${String(9 + (index % 8)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`;

    const listStatus = spec.status as LeaveListItem['status'];

    const row: LeaveListItem = {
      id,
      application_number: applicationNumber,
      member_id: member.memberId,
      member_number: member.memberNumber,
      member_name: memberFullName(member),
      brand: member.primaryStore.brandEnum,
      store_id: member.primaryStore.storeId,
      store_name: member.primaryStore.name,
      type: spec.type,
      status: listStatus,
      applied_at: formatDateYYYYMMDD(appliedDate),
      scheduled_date: scheduledStr,
      end_date: endDate,
      unpaid_amount: 0,
      cancellable,
      cancellation_blocked_reason,
    };

    if (spec.inList) rows.push(row);

    details[id] = {
      id,
      application_number: applicationNumber,
      member: toLeaveMember(member),
      brand: row.brand,
      store_id: row.store_id,
      store_name: row.store_name,
      type: spec.type,
      status: spec.status,
      applied_at: appliedAt,
      approved_at: appliedAt,
      scheduled_date: scheduledStr,
      end_date: endDate,
      reason: spec.reason ?? REASONS[index % REASONS.length]!,
      applicant: `${row.member_name}（本人）`,
      is_proxy_applied: false,
      proxy_applicant: null,
      consent_at: null,
      consent_method: null,
      suspension_fee: isSuspension ? 1100 : null,
      // `?? 3300` would swallow an explicit `null`, which is exactly what the no-fee
      // fixture needs, so absence and a deliberate null are distinguished here.
      withdrawal_fee: isSuspension
        ? null
        : spec.withdrawalFee !== undefined
          ? spec.withdrawalFee
          : 3300,
      applied_campaign: 'なし',
      unused_lessons: 2,
      unpaid_amount: 0,
      usage_start_date: usageStartDate,
      cancellable,
      cancellation_blocked_reason,
      cancelled_by: null,
      cancelled_at: null,
      // Rebuilt for every member below, once all fixture rows exist.
      suspension_history: [],
      created_at: appliedAt,
      updated_at: appliedAt,
    };
  };

  let nextIndex = staged.length;

  for (const fixture of FIXTURES) {
    const member =
      fixture.memberNumber !== undefined
        ? candidates.find((m) => m.memberNumber === fixture.memberNumber)
        : candidates[fixture.memberOffset ?? 0];
    if (!member) continue;
    appendRecord(member, nextIndex, fixture);
    nextIndex += 1;
  }

  // Pagination fillers, spread over the members already carrying a withdrawal-side status
  // so no member's status contradicts the application appended to them.
  const fillerMembers = candidates.filter(
    (m) =>
      m.memberStatus === MemberStatus.PENDING_WITHDRAWAL ||
      m.memberStatus === MemberStatus.WITHDRAWN,
  );
  for (let i = 0; i < PAGINATION_FILLER_COUNT && fillerMembers.length > 0; i += 1) {
    appendRecord(fillerMembers[i % fillerMembers.length]!, nextIndex, {
      type: 'withdrawal',
      status: i % 2 === 0 ? 'withdrawal_pending' : 'withdrawal_scheduled',
      inList: true,
    });
    nextIndex += 1;
  }

  // The strip is a member-wide projection, so it has to be rebuilt once every row exists.
  for (const [detailId, detail] of Object.entries(details)) {
    details[detailId] = {
      ...detail,
      suspension_history: deriveSuspensionHistory(
        rows.filter((r) => r.member_id === detail.member.member_id),
      ),
    };
  }

  return { rows, details };
}
