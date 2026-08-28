import type { BlacklistDetail } from '@/app/api/_schemas/blacklist.schema';
import type {
  ApprovalHistoryItem,
  ExclusionReason,
  TransferDecision,
  TransferDetail,
  TransferUnlock,
} from '@/app/api/_schemas/transfer.schema';

/**
 * The stored row.
 *
 * Two groups of fields are deliberately excluded because they are derived at serialisation time,
 * not persisted:
 * - `can_act` depends on *who is asking*, so a stored copy would go stale for the next reader.
 * - the member head-up fields are owned by the member record; duplicating them here would let
 *   the transfer screen show a stale name or contract after the member was edited.
 */
export type TransferRow = Omit<
  TransferDetail,
  'can_act' | 'member_name_kana' | 'old_member_no' | 'member_type' | 'contract_name'
>;
export type BlacklistRow = BlacklistDetail;

export enum TransferStatus {
  /** 申請中 — created, not yet routed into the origin-store approval queue */
  Pending = 'pending',
  /** 移籍元承認待ち */
  FromStorePending = 'from_store_pending',
  /** 移籍先承認待ち (FIT365 only) */
  FromStoreApproved = 'from_store_approved',
  /** 完了 — executed; the member's contracted store has been updated */
  Completed = 'completed',
  /** 否認 */
  Rejected = 'rejected',
}

/** Statuses at which the origin store is the actor. `pending` and `from_store_pending` share a stage. */
export const ORIGIN_STAGE_STATUSES: readonly TransferStatus[] = [
  TransferStatus.Pending,
  TransferStatus.FromStorePending,
];

export const TERMINAL_STATUSES: readonly TransferStatus[] = [
  TransferStatus.Completed,
  TransferStatus.Rejected,
];

export const DEFAULT_MEMBER_MAIN_CONTRACT: string = 'レギュラー会員';

const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth();

export function isoDate(year: number, month: number, day: number): string {
  return new Date(year, month, day).toISOString();
}

const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
const twoMonthsAgo = (thisMonth + 10) % 12;
const twoMonthsAgoYear = thisMonth <= 1 ? thisYear - 1 : thisYear;

const DAY_MS = 24 * 3600 * 1000;
const addDays = (iso: string, days: number): string =>
  new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();

/**
 * FR-007 brand-shaped approval history. The single source of both the seed fixtures and
 * `transfers.create()` — the pre-update `create()` hardcoded a FIT365-shaped 3-step history
 * for every brand, so a JOYFIT transfer created from member detail rendered the wrong flow.
 *
 * - JOYFIT (3 steps): 申請 → 移籍元承認 → システム自動移籍実行 (`is_automatic`)
 * - FIT365 (4 steps): 申請 → 移籍元承認 → 移籍先承認 → 移籍実行
 */
export function buildApprovalHistory(
  brand: 'joyfit' | 'fit365',
  status: TransferStatus,
  appliedAt: string,
): ApprovalHistoryItem[] {
  const executed = status === TransferStatus.Completed;
  // FIT365 sits at from_store_approved after the origin store signs off; JOYFIT skips
  // straight to completed, so `executed` alone marks its origin step done.
  const originApproved = status === TransferStatus.FromStoreApproved || executed;

  const originApprovedAt = originApproved ? addDays(appliedAt, 2) : null;
  const destinationApprovedAt = executed && originApprovedAt ? addDays(originApprovedAt, 1) : null;
  const executedAt = executed ? addDays(originApprovedAt ?? appliedAt, 1) : null;

  const applicationStep: ApprovalHistoryItem = {
    step: 1,
    label: '申請',
    store_type: null,
    completed: true,
    completed_at: appliedAt,
    completed_by: null,
    is_automatic: false,
  };

  const originStep: ApprovalHistoryItem = {
    step: 2,
    label: '移籍元承認',
    store_type: 'from',
    completed: originApproved,
    completed_at: originApprovedAt,
    completed_by: originApproved ? '移籍元スタッフ' : null,
    is_automatic: false,
  };

  if (brand === 'joyfit') {
    return [
      applicationStep,
      originStep,
      {
        step: 3,
        label: 'システム自動移籍実行',
        store_type: null,
        completed: executed,
        completed_at: executedAt,
        completed_by: null,
        is_automatic: true,
      },
    ];
  }

  return [
    applicationStep,
    originStep,
    {
      step: 3,
      label: '移籍先承認',
      store_type: 'to',
      completed: executed,
      completed_at: destinationApprovedAt,
      completed_by: executed ? '移籍先スタッフ' : null,
      is_automatic: false,
    },
    {
      step: 4,
      label: '移籍実行',
      store_type: null,
      completed: executed,
      completed_at: executedAt,
      completed_by: null,
      is_automatic: false,
    },
  ];
}

// ─── Seed fixtures ────────────────────────────────────────────────────────────
//
// Member IDs and store IDs below are REAL rows from the members / stores tables
// (`M-000NN`, `store-00N`). The pre-update fixtures used invented `M-10001` /
// `store-joyfit-001` values that existed nowhere, so store scoping matched nothing and
// the contracted-store side effect on 完了 could never be observed.
//
// Store reference: store-001 Fit365八潮店 / store-002 Fit365新宿店 / store-003 Fit365渋谷店 /
// store-004 JOYFIT池袋店 / store-005 JOYFIT大宮店 / store-009 Fit365梅田店 /
// store-010 ジョイフィット静岡店.

const STORE_NAMES: Record<string, string> = {
  'store-001': 'Fit365八潮店',
  'store-002': 'Fit365新宿店',
  'store-003': 'Fit365渋谷店',
  'store-004': 'JOYFIT池袋店',
  'store-005': 'JOYFIT大宮店',
  'store-009': 'Fit365梅田店',
  'store-010': 'ジョイフィット静岡店',
};

type TransferSeedSpec = {
  id: string;
  member_id: string;
  member_name: string;
  brand: 'joyfit' | 'fit365';
  from: string;
  to: string;
  status: TransferStatus;
  applied_at: string;
  scheduled_date: string;
  reason: string;
  applicant_name: string;
  applicant_role: string;
  /**
   * Declared exclusions (JOYFIT only). `auto_transfer_eligible` is derived from these, never
   * set by hand, so the data-model invariant
   * `exclusion_reasons` non-empty ⟺ `auto_transfer_eligible === false` cannot drift.
   */
  exclusions?: ExclusionReason[];
  unpaid_amount?: number;
  unpaid_period?: string;
  campaign_lock_remaining_days?: number;
  decisions?: TransferDecision[];
  unlock?: TransferUnlock;
};

const TRANSFER_SEED_SPECS: TransferSeedSpec[] = [
  // ── JOYFIT, eligible for automatic transfer (bulk-approve fixtures) ──
  {
    id: 'TR-001',
    member_id: 'M-00024',
    member_name: '中村 由美',
    brand: 'joyfit',
    from: 'store-005',
    to: 'store-004',
    status: TransferStatus.Pending,
    applied_at: isoDate(thisYear, thisMonth, 5),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    reason: '転居のため',
    applicant_name: '中村 由美',
    applicant_role: '会員本人',
  },
  {
    id: 'TR-003',
    member_id: 'M-00054',
    member_name: '中村 由美',
    brand: 'joyfit',
    from: 'store-005',
    to: 'store-010',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(thisYear, thisMonth, 8),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    reason: '通勤経路が変わったため',
    applicant_name: '田中 一郎',
    applicant_role: 'スタッフ',
  },
  {
    id: 'TR-009',
    member_id: 'M-00019',
    member_name: '中村 由美',
    brand: 'joyfit',
    from: 'store-010',
    to: 'store-005',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(lastMonthYear, lastMonth, 22),
    scheduled_date: isoDate(thisYear, thisMonth, 1),
    reason: '自宅の近くに引っ越したため',
    applicant_name: '鈴木 次郎',
    applicant_role: 'スタッフ',
  },

  // ── JOYFIT, excluded from automatic transfer (FR-006) ──
  {
    id: 'TR-005',
    member_id: 'M-00013',
    member_name: '山田 健太',
    brand: 'joyfit',
    from: 'store-004',
    to: 'store-005',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(thisYear, thisMonth, 11),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    reason: '職場の近くに利用したいため',
    applicant_name: '佐藤 三郎',
    applicant_role: 'スタッフ',
    exclusions: ['unpaid'],
    unpaid_amount: 8580,
    unpaid_period: `${thisYear}年${((lastMonth + 12) % 12) + 1}月分`,
  },
  {
    id: 'TR-006',
    member_id: 'M-00009',
    member_name: '中村 由美',
    brand: 'joyfit',
    from: 'store-010',
    to: 'store-004',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(thisYear, thisMonth, 13),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 10),
    reason: '家族と一緒に通いたいため',
    applicant_name: '山田 四郎',
    applicant_role: 'スタッフ',
    exclusions: ['campaign_lock'],
    campaign_lock_remaining_days: 45,
  },
  {
    // Spec edge case: BOTH exclusion reasons on one row. Unlocking the campaign lock must
    // leave this row excluded, because the unpaid balance has no override control.
    id: 'TR-007',
    member_id: 'M-00084',
    member_name: '中村 由美',
    brand: 'joyfit',
    from: 'store-005',
    to: 'store-010',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(thisYear, thisMonth, 15),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    reason: '営業時間の都合のため',
    applicant_name: '中村 五郎',
    applicant_role: 'スタッフ',
    exclusions: ['unpaid', 'campaign_lock'],
    unpaid_amount: 13200,
    unpaid_period: `${thisYear}年${((lastMonth + 12) % 12) + 1}月分`,
    campaign_lock_remaining_days: 20,
  },
  {
    // Already manually unlocked (FR-012) — renders the success alert at PAR049.
    id: 'TR-008',
    member_id: 'M-00033',
    member_name: '山田 健太',
    brand: 'joyfit',
    from: 'store-004',
    to: 'store-005',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(thisYear, thisMonth, 16),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    reason: '設備が充実している店舗に移りたいため',
    applicant_name: '小林 六郎',
    applicant_role: 'スタッフ',
    exclusions: ['campaign_lock'],
    campaign_lock_remaining_days: 10,
    unlock: {
      reason: '会員都合ではなく店舗都合の移籍のため、解約手数料期間の縛りを解除',
      operator_name: '本部 管理者',
      unlocked_at: isoDate(thisYear, thisMonth, 17),
    },
  },

  // ── FIT365, two-stage manual approval ──
  {
    id: 'TR-002',
    member_id: 'M-00030',
    member_name: '佐藤 花子',
    brand: 'fit365',
    from: 'store-001',
    to: 'store-002',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(thisYear, thisMonth, 6),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    reason: '転居のため',
    applicant_name: '伊藤 七郎',
    applicant_role: 'スタッフ',
  },
  {
    // store-001 is the DESTINATION here, so a store-001 Staff must see the row but get no
    // action while it is still awaiting the origin store (quickstart §A).
    id: 'TR-004',
    member_id: 'M-00001',
    member_name: '鈴木 太郎',
    brand: 'fit365',
    from: 'store-002',
    to: 'store-001',
    status: TransferStatus.FromStorePending,
    applied_at: isoDate(thisYear, thisMonth, 9),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    reason: '通勤経路が変わったため',
    applicant_name: '田中 一郎',
    applicant_role: 'マネージャー',
  },
  {
    id: 'TR-010',
    member_id: 'M-00012',
    member_name: '田中 美咲',
    brand: 'fit365',
    from: 'store-003',
    to: 'store-001',
    status: TransferStatus.FromStoreApproved,
    applied_at: isoDate(lastMonthYear, lastMonth, 12),
    scheduled_date: isoDate(thisYear, thisMonth, 1),
    reason: '自宅の近くに引っ越したため',
    applicant_name: '鈴木 次郎',
    applicant_role: 'スタッフ',
  },
  {
    id: 'TR-011',
    member_id: 'M-00060',
    member_name: '佐藤 花子',
    brand: 'fit365',
    from: 'store-001',
    to: 'store-003',
    status: TransferStatus.FromStoreApproved,
    applied_at: isoDate(lastMonthYear, lastMonth, 18),
    scheduled_date: isoDate(thisYear, thisMonth, 1),
    reason: '家族と一緒に通いたいため',
    applicant_name: '佐藤 三郎',
    applicant_role: 'スタッフ',
    decisions: [
      {
        action: 'approve',
        comment: '本人確認済み。移籍先店舗の受け入れ可否を確認してください。',
        actor_name: '移籍元スタッフ',
        actor_role: 'Staff',
        store_type: 'from',
        decided_at: addDays(isoDate(lastMonthYear, lastMonth, 18), 2),
      },
    ],
  },

  // ── Terminal states ──
  {
    id: 'TR-012',
    member_id: 'M-00114',
    member_name: '中村 由美',
    brand: 'joyfit',
    from: 'store-005',
    to: 'store-004',
    status: TransferStatus.Completed,
    applied_at: isoDate(twoMonthsAgoYear, twoMonthsAgo, 5),
    scheduled_date: isoDate(lastMonthYear, lastMonth, 1),
    reason: '転居のため',
    applicant_name: '中村 由美',
    applicant_role: '会員本人',
    decisions: [
      {
        action: 'approve',
        comment: null,
        actor_name: '移籍元スタッフ',
        actor_role: 'Staff',
        store_type: 'from',
        decided_at: addDays(isoDate(twoMonthsAgoYear, twoMonthsAgo, 5), 2),
      },
    ],
  },
  {
    id: 'TR-013',
    member_id: 'M-00018',
    member_name: '山田 健太',
    brand: 'fit365',
    from: 'store-009',
    to: 'store-003',
    status: TransferStatus.Completed,
    applied_at: isoDate(twoMonthsAgoYear, twoMonthsAgo, 12),
    scheduled_date: isoDate(lastMonthYear, lastMonth, 1),
    reason: '職場の近くに利用したいため',
    applicant_name: '小林 六郎',
    applicant_role: 'マネージャー',
    decisions: [
      {
        action: 'approve',
        comment: '移籍元として承認します。',
        actor_name: '移籍元スタッフ',
        actor_role: 'Staff',
        store_type: 'from',
        decided_at: addDays(isoDate(twoMonthsAgoYear, twoMonthsAgo, 12), 2),
      },
      {
        action: 'approve',
        comment: '受け入れ可能です。',
        actor_name: '移籍先スタッフ',
        actor_role: 'Staff',
        store_type: 'to',
        decided_at: addDays(isoDate(twoMonthsAgoYear, twoMonthsAgo, 12), 3),
      },
    ],
  },
  {
    id: 'TR-014',
    member_id: 'M-00029',
    member_name: '中村 由美',
    brand: 'joyfit',
    from: 'store-010',
    to: 'store-004',
    status: TransferStatus.Rejected,
    applied_at: isoDate(twoMonthsAgoYear, twoMonthsAgo, 18),
    scheduled_date: isoDate(lastMonthYear, lastMonth, 1),
    reason: '営業時間の都合のため',
    applicant_name: '伊藤 七郎',
    applicant_role: 'スタッフ',
    decisions: [
      {
        action: 'reject',
        comment:
          '移籍予定日までに未使用のレッスン回数が消化できないため、日程を再調整してください。',
        actor_name: '移籍元スタッフ',
        actor_role: 'Staff',
        store_type: 'from',
        decided_at: addDays(isoDate(twoMonthsAgoYear, twoMonthsAgo, 18), 2),
      },
    ],
  },
];

function toTransferRow(spec: TransferSeedSpec): TransferRow {
  const isJoyfit = spec.brand === 'joyfit';
  const declared = spec.exclusions ?? [];
  // A manual unlock releases only the campaign lock — a co-present unpaid balance keeps the
  // row excluded (contracts §6.3). Mirrors what `transfers.unlock()` does at runtime.
  const effective = spec.unlock ? declared.filter((r) => r !== 'campaign_lock') : declared;
  return {
    id: spec.id,
    member_id: spec.member_id,
    member_name: spec.member_name,
    from_store_id: spec.from,
    from_store_name: STORE_NAMES[spec.from] ?? spec.from,
    to_store_id: spec.to,
    to_store_name: STORE_NAMES[spec.to] ?? spec.to,
    brand: spec.brand,
    applied_at: spec.applied_at,
    scheduled_date: spec.scheduled_date,
    status: spec.status,
    // FIT365 has no automatic transfer, so eligibility stays null and the 自動移籍可否
    // column renders "—" (PAR028).
    auto_transfer_eligible: isJoyfit ? effective.length === 0 : null,
    exclusion_reasons: isJoyfit ? effective : [],
    // The amount / remaining days survive an unlock so the detail screen can still show what
    // was overridden (PAR049).
    unpaid_amount: declared.includes('unpaid') ? (spec.unpaid_amount ?? 0) : null,
    campaign_lock_remaining_days: declared.includes('campaign_lock')
      ? (spec.campaign_lock_remaining_days ?? 0)
      : null,
    reason: spec.reason,
    applicant_name: spec.applicant_name,
    applicant_role: spec.applicant_role,
    updated_at:
      spec.decisions?.[spec.decisions.length - 1]?.decided_at ??
      spec.unlock?.unlocked_at ??
      spec.applied_at,
    approval_history: buildApprovalHistory(spec.brand, spec.status, spec.applied_at),
    unpaid_period: declared.includes('unpaid') ? (spec.unpaid_period ?? null) : null,
    decisions: spec.decisions ?? [],
    unlock: spec.unlock ?? null,
  };
}

export const TRANSFER_SEED_DATA: TransferRow[] = TRANSFER_SEED_SPECS.map(toTransferRow);
