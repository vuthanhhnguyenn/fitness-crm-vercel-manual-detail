import type { BlacklistDetail } from '@/app/api/_schemas/blacklist.schema';
import type { ApprovalHistoryItem, TransferDetail } from '@/app/api/_schemas/transfer.schema';

export type TransferRow = TransferDetail;
export type BlacklistRow = BlacklistDetail;

export enum TransferStatus {
  Pending = 'pending',
  FromStoreApproved = 'from_store_approved',
  Approved = 'approved',
  Rejected = 'rejected',
  Completed = 'completed',
}

export const DEFAULT_MEMBER_MAIN_CONTRACT: string = 'レギュラー会員';

const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth();

export function isoDate(year: number, month: number, day: number): string {
  return new Date(year, month, day).toISOString();
}

const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
const prevYearMonth = thisMonth === 0 ? 11 : thisMonth;
const prevYear = thisYear - 1;

export function buildApprovalHistory(
  brand: 'joyfit' | 'fit365',
  status: TransferStatus,
  appliedAt: string,
): ApprovalHistoryItem[] {
  const stepOneCompleted = true;
  const fromApproved =
    status === TransferStatus.FromStoreApproved ||
    status === TransferStatus.Approved ||
    status === TransferStatus.Completed;
  const toApproved = status === TransferStatus.Approved || status === TransferStatus.Completed;
  const completed = status === TransferStatus.Completed;

  const appliedDate = new Date(appliedAt);
  const fromApprovedAt = fromApproved
    ? new Date(appliedDate.getTime() + 2 * 24 * 3600 * 1000).toISOString()
    : null;
  const toApprovedAt =
    toApproved && fromApprovedAt
      ? new Date(new Date(fromApprovedAt).getTime() + 1 * 24 * 3600 * 1000).toISOString()
      : null;
  const completedAt =
    completed && toApprovedAt
      ? new Date(new Date(toApprovedAt).getTime() + 1 * 24 * 3600 * 1000).toISOString()
      : completed && fromApprovedAt
        ? new Date(new Date(fromApprovedAt).getTime() + 1 * 24 * 3600 * 1000).toISOString()
        : null;

  if (brand === 'joyfit') {
    return [
      {
        step: 1,
        label: '申請',
        store_type: null,
        completed: stepOneCompleted,
        completed_at: appliedAt,
        completed_by: null,
        is_automatic: false,
      },
      {
        step: 2,
        label: '移籍元承認',
        store_type: 'from',
        completed: fromApproved,
        completed_at: fromApprovedAt,
        completed_by: fromApproved ? '移籍元スタッフ' : null,
        is_automatic: false,
      },
      {
        step: 3,
        label: 'システム自動移籍実行',
        store_type: null,
        completed: completed,
        completed_at: completedAt,
        completed_by: null,
        is_automatic: true,
      },
    ];
  }

  return [
    {
      step: 1,
      label: '申請',
      store_type: null,
      completed: stepOneCompleted,
      completed_at: appliedAt,
      completed_by: null,
      is_automatic: false,
    },
    {
      step: 2,
      label: '移籍元承認',
      store_type: 'from',
      completed: fromApproved,
      completed_at: fromApprovedAt,
      completed_by: fromApproved ? '移籍元スタッフ' : null,
      is_automatic: false,
    },
    {
      step: 3,
      label: '移籍先承認',
      store_type: 'to',
      completed: toApproved,
      completed_at: toApprovedAt,
      completed_by: toApproved ? '移籍先スタッフ' : null,
      is_automatic: false,
    },
    {
      step: 4,
      label: '移籍実行',
      store_type: null,
      completed: completed,
      completed_at: completedAt,
      completed_by: null,
      is_automatic: false,
    },
  ];
}

const TRANSFER_REASONS = [
  '転居のため',
  '通勤経路が変わったため',
  '職場の近くに利用したいため',
  '自宅の近くに引っ越したため',
  '家族と一緒に通いたいため',
  '営業時間の都合のため',
  '設備が充実している店舗に移りたいため',
];

const TRANSFER_APPLICANT_NAMES = [
  '田中 一郎',
  '鈴木 次郎',
  '佐藤 三郎',
  '山田 四郎',
  '中村 五郎',
  '小林 六郎',
  '伊藤 七郎',
];

export const TRANSFER_SEED_DATA: TransferRow[] = [
  {
    id: 'TR-001',
    member_id: 'M-10001',
    member_name: '山田 太郎',
    from_store_id: 'store-joyfit-001',
    from_store_name: 'JOYFIT池袋店',
    to_store_id: 'store-joyfit-002',
    to_store_name: 'JOYFIT新宿店',
    brand: 'joyfit',
    applied_at: isoDate(thisYear, thisMonth, 5),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    status: TransferStatus.Pending,
    reason: TRANSFER_REASONS[0]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[0]!,
    applicant_role: 'staff',
    updated_at: isoDate(thisYear, thisMonth, 5),
    approval_history: buildApprovalHistory(
      'joyfit',
      TransferStatus.Pending,
      isoDate(thisYear, thisMonth, 5),
    ),
  },
  {
    id: 'TR-002',
    member_id: 'M-10002',
    member_name: '鈴木 花子',
    from_store_id: 'store-fit365-001',
    from_store_name: 'FIT365八潮店',
    to_store_id: 'store-fit365-002',
    to_store_name: 'FIT365川口店',
    brand: 'fit365',
    applied_at: isoDate(thisYear, thisMonth, 10),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    status: TransferStatus.Pending,
    reason: TRANSFER_REASONS[1]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[1]!,
    applicant_role: 'manager',
    updated_at: isoDate(thisYear, thisMonth, 10),
    approval_history: buildApprovalHistory(
      'fit365',
      TransferStatus.Pending,
      isoDate(thisYear, thisMonth, 10),
    ),
  },
  {
    id: 'TR-003',
    member_id: 'M-10003',
    member_name: '佐藤 一郎',
    from_store_id: 'store-joyfit-003',
    from_store_name: 'JOYFIT渋谷店',
    to_store_id: 'store-joyfit-001',
    to_store_name: 'JOYFIT池袋店',
    brand: 'joyfit',
    applied_at: isoDate(thisYear, thisMonth, 8),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 1),
    status: TransferStatus.FromStoreApproved,
    reason: TRANSFER_REASONS[2]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[2]!,
    applicant_role: 'staff',
    updated_at: isoDate(thisYear, thisMonth, 10),
    approval_history: buildApprovalHistory(
      'joyfit',
      TransferStatus.FromStoreApproved,
      isoDate(thisYear, thisMonth, 8),
    ),
  },
  {
    id: 'TR-004',
    member_id: 'M-10004',
    member_name: '田中 美咲',
    from_store_id: 'store-fit365-002',
    from_store_name: 'FIT365川口店',
    to_store_id: 'store-fit365-003',
    to_store_name: 'FIT365大宮店',
    brand: 'fit365',
    applied_at: isoDate(thisYear, thisMonth, 12),
    scheduled_date: isoDate(thisYear, thisMonth + 1, 15),
    status: TransferStatus.FromStoreApproved,
    reason: TRANSFER_REASONS[3]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[3]!,
    applicant_role: 'manager',
    updated_at: isoDate(thisYear, thisMonth, 14),
    approval_history: buildApprovalHistory(
      'fit365',
      TransferStatus.FromStoreApproved,
      isoDate(thisYear, thisMonth, 12),
    ),
  },
  {
    id: 'TR-005',
    member_id: 'M-10005',
    member_name: '高橋 健司',
    from_store_id: 'store-joyfit-002',
    from_store_name: 'JOYFIT新宿店',
    to_store_id: 'store-joyfit-004',
    to_store_name: 'JOYFIT横浜店',
    brand: 'joyfit',
    applied_at: isoDate(lastMonthYear, lastMonth, 15),
    scheduled_date: isoDate(thisYear, thisMonth, 1),
    status: TransferStatus.Approved,
    reason: TRANSFER_REASONS[4]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[4]!,
    applicant_role: 'staff',
    updated_at: isoDate(lastMonthYear, lastMonth, 17),
    approval_history: buildApprovalHistory(
      'joyfit',
      TransferStatus.Approved,
      isoDate(lastMonthYear, lastMonth, 15),
    ),
  },
  {
    id: 'TR-006',
    member_id: 'M-10006',
    member_name: '伊藤 恵子',
    from_store_id: 'store-fit365-003',
    from_store_name: 'FIT365大宮店',
    to_store_id: 'store-fit365-001',
    to_store_name: 'FIT365八潮店',
    brand: 'fit365',
    applied_at: isoDate(lastMonthYear, lastMonth, 20),
    scheduled_date: isoDate(thisYear, thisMonth, 1),
    status: TransferStatus.Approved,
    reason: TRANSFER_REASONS[5]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[5]!,
    applicant_role: 'manager',
    updated_at: isoDate(lastMonthYear, lastMonth, 23),
    approval_history: buildApprovalHistory(
      'fit365',
      TransferStatus.Approved,
      isoDate(lastMonthYear, lastMonth, 20),
    ),
  },
  {
    id: 'TR-007',
    member_id: 'M-10007',
    member_name: '渡辺 直樹',
    from_store_id: 'store-joyfit-004',
    from_store_name: 'JOYFIT横浜店',
    to_store_id: 'store-joyfit-003',
    to_store_name: 'JOYFIT渋谷店',
    brand: 'joyfit',
    applied_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 10),
    scheduled_date: isoDate(thisYear, Math.max(thisMonth - 1, 0), 1),
    status: TransferStatus.Rejected,
    reason: TRANSFER_REASONS[6]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[6]!,
    applicant_role: 'staff',
    updated_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 12),
    approval_history: buildApprovalHistory(
      'joyfit',
      TransferStatus.Rejected,
      isoDate(thisYear, Math.max(thisMonth - 2, 0), 10),
    ),
  },
  {
    id: 'TR-008',
    member_id: 'M-10008',
    member_name: '中村 さくら',
    from_store_id: 'store-fit365-001',
    from_store_name: 'FIT365八潮店',
    to_store_id: 'store-fit365-004',
    to_store_name: 'FIT365越谷店',
    brand: 'fit365',
    applied_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 18),
    scheduled_date: isoDate(thisYear, Math.max(thisMonth - 1, 0), 1),
    status: TransferStatus.Rejected,
    reason: TRANSFER_REASONS[0]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[0]!,
    applicant_role: 'manager',
    updated_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 20),
    approval_history: buildApprovalHistory(
      'fit365',
      TransferStatus.Rejected,
      isoDate(thisYear, Math.max(thisMonth - 2, 0), 18),
    ),
  },
  {
    id: 'TR-009',
    member_id: 'M-10009',
    member_name: '小林 隆',
    from_store_id: 'store-joyfit-001',
    from_store_name: 'JOYFIT池袋店',
    to_store_id: 'store-joyfit-002',
    to_store_name: 'JOYFIT新宿店',
    brand: 'joyfit',
    applied_at: isoDate(prevYear, prevYearMonth, 5),
    scheduled_date: isoDate(prevYear, prevYearMonth + 1, 1),
    status: TransferStatus.Completed,
    reason: TRANSFER_REASONS[1]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[1]!,
    applicant_role: 'staff',
    updated_at: isoDate(prevYear, prevYearMonth, 10),
    approval_history: buildApprovalHistory(
      'joyfit',
      TransferStatus.Completed,
      isoDate(prevYear, prevYearMonth, 5),
    ),
  },
  {
    id: 'TR-010',
    member_id: 'M-10010',
    member_name: '加藤 幸子',
    from_store_id: 'store-fit365-004',
    from_store_name: 'FIT365越谷店',
    to_store_id: 'store-fit365-002',
    to_store_name: 'FIT365川口店',
    brand: 'fit365',
    applied_at: isoDate(prevYear, prevYearMonth, 12),
    scheduled_date: isoDate(prevYear, prevYearMonth + 1, 1),
    status: TransferStatus.Completed,
    reason: TRANSFER_REASONS[2]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[2]!,
    applicant_role: 'manager',
    updated_at: isoDate(prevYear, prevYearMonth, 17),
    approval_history: buildApprovalHistory(
      'fit365',
      TransferStatus.Completed,
      isoDate(prevYear, prevYearMonth, 12),
    ),
  },
  {
    id: 'TR-011',
    member_id: 'M-10011',
    member_name: '小林 隆',
    from_store_id: 'store-joyfit-001',
    from_store_name: 'JOYFIT池袋店',
    to_store_id: 'store-joyfit-002',
    to_store_name: 'JOYFIT新宿店',
    brand: 'joyfit',
    applied_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 10),
    scheduled_date: isoDate(thisYear, Math.max(thisMonth - 1, 0), 1),
    status: TransferStatus.Rejected,
    reason: TRANSFER_REASONS[3]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[3]!,
    applicant_role: 'staff',
    updated_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 12),
    approval_history: buildApprovalHistory(
      'joyfit',
      TransferStatus.Rejected,
      isoDate(thisYear, Math.max(thisMonth - 2, 0), 10),
    ),
  },
  {
    id: 'TR-012',
    member_id: 'M-10012',
    member_name: '中村 さくら',
    from_store_id: 'store-fit365-001',
    from_store_name: 'FIT365八潮店',
    to_store_id: 'store-fit365-004',
    to_store_name: 'FIT365越谷店',
    brand: 'fit365',
    applied_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 18),
    scheduled_date: isoDate(thisYear, Math.max(thisMonth - 1, 0), 1),
    status: TransferStatus.Rejected,
    reason: TRANSFER_REASONS[4]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[4]!,
    applicant_role: 'manager',
    updated_at: isoDate(thisYear, Math.max(thisMonth - 2, 0), 20),
    approval_history: buildApprovalHistory(
      'fit365',
      TransferStatus.Rejected,
      isoDate(thisYear, Math.max(thisMonth - 2, 0), 18),
    ),
  },
  {
    id: 'TR-013',
    member_id: 'M-10013',
    member_name: '小林 隆',
    from_store_id: 'store-joyfit-001',
    from_store_name: 'JOYFIT池袋店',
    to_store_id: 'store-joyfit-002',
    to_store_name: 'JOYFIT新宿店',
    brand: 'joyfit',
    applied_at: isoDate(prevYear, prevYearMonth, 5),
    scheduled_date: isoDate(prevYear, prevYearMonth + 1, 1),
    status: TransferStatus.Completed,
    reason: TRANSFER_REASONS[5]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[5]!,
    applicant_role: 'staff',
    updated_at: isoDate(prevYear, prevYearMonth, 8),
    approval_history: buildApprovalHistory(
      'joyfit',
      TransferStatus.Completed,
      isoDate(prevYear, prevYearMonth, 5),
    ),
  },
  {
    id: 'TR-014',
    member_id: 'M-10014',
    member_name: '加藤 幸子',
    from_store_id: 'store-fit365-004',
    from_store_name: 'FIT365越谷店',
    to_store_id: 'store-fit365-002',
    to_store_name: 'FIT365川口店',
    brand: 'fit365',
    applied_at: isoDate(prevYear, prevYearMonth, 12),
    scheduled_date: isoDate(prevYear, prevYearMonth + 1, 1),
    status: TransferStatus.Completed,
    reason: TRANSFER_REASONS[6]!,
    applicant_name: TRANSFER_APPLICANT_NAMES[6]!,
    applicant_role: 'manager',
    updated_at: isoDate(prevYear, prevYearMonth, 15),
    approval_history: buildApprovalHistory(
      'fit365',
      TransferStatus.Completed,
      isoDate(prevYear, prevYearMonth, 12),
    ),
  },
];
