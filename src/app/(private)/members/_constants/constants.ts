import {
  Brand,
  ContractType,
  Gender,
  MainBrand,
  MemberStatus,
  MemberType,
  MemoType,
} from '@/lib/api/types.gen';

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  [MemberType.REGULAR]: '通常会員',
  [MemberType.ONE_DAY_MEMBER]: '1Day会員',
  [MemberType.FAMILY]: '家族会員',
  [MemberType.CORPORATE]: '法人会員',
};

/**
 * Resolves a raw `member_type` enum to its Japanese label. The shared
 * `MemberHeadupCard` takes display-ready text by contract, so every caller of it goes
 * through here rather than passing the enum straight to the card.
 */
export function memberTypeLabel(memberType: string | null | undefined): string | null {
  if (!memberType) return null;
  return MEMBER_TYPE_LABELS[memberType as MemberType] ?? memberType;
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.REGULAR]: '通常会員',
  [ContractType.ONE_DAY_MEMBER]: '1Day会員',
  [ContractType.FAMILY]: '家族会員',
};

export const JOIN_PERIOD_LABELS: Record<string, string> = {
  this_month: '今月',
  last_month: '先月',
  this_year: '今年',
  last_year: '昨年',
};

export const LAST_VISIT_LABELS: Record<string, string> = {
  within_1w: '直近1週間',
  within_2w: '直近2週間',
  over_3w: '3週間以上来館なし',
  over_1m: '1ヶ月以上来館なし',
};

/**
 * Member status labels — one per `member_status` DB value (8 of them).
 *
 * ゲートストップ is deliberately absent: gate stop is an orthogonal flag
 * (`has_gate_stop`), not a status, so it has its own badge below. Labels for the
 * suspension/withdrawal states follow the A-03 FR-001 wording the backend
 * documents on the shared display-status enum.
 */
export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.PROVISIONAL]: '仮会員',
  [MemberStatus.ACTIVE]: '有効',
  [MemberStatus.PENDING_SUSPENDED]: '休会予定',
  [MemberStatus.SUSPENDED]: '休会中',
  [MemberStatus.PENDING_WITHDRAWAL]: '退会予定',
  [MemberStatus.WITHDRAWAL_PENDING_PROCESSING]: '退会処理待ち',
  [MemberStatus.WITHDRAWN]: '退会済み',
  [MemberStatus.FORCED_WITHDRAWAL]: '強制退会済み',
};

/** Badge for the gate-stop flag. Not a member status — see `MEMBER_STATUS_LABELS`. */
export const GATE_STOP_LABEL = 'ゲートストップ';
export const GATE_STOP_CLASSES = 'bg-destructive/15 text-destructive border-destructive/20';

/**
 * The ステータス dropdown keeps the prototype's 4 options + ゲートストップ, while the
 * API speaks all 8 DB values. Each option therefore fans out to the statuses it
 * covers, which the backend accepts as a comma-separated list.
 *
 * `gate_stop` is the odd one out: it sends `has_gate_stop=true` and NO status,
 * so it returns gate-stopped members whatever their status is (A-01, backend
 * design answer 2026-08-10).
 */
export const MEMBER_STATUS_FILTER_ALL = 'all';
export const MEMBER_STATUS_FILTER_GATE_STOP = 'gate_stop';

export const MEMBER_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
  statuses: MemberStatus[];
}> = [
  {
    value: 'active',
    label: '有効',
    // 仮会員 has no option of its own on this screen; it rides along with 有効.
    statuses: [MemberStatus.ACTIVE, MemberStatus.PROVISIONAL],
  },
  {
    value: 'suspended',
    label: '休会中',
    statuses: [MemberStatus.SUSPENDED, MemberStatus.PENDING_SUSPENDED],
  },
  {
    value: 'pending_withdrawal',
    label: '退会予定',
    statuses: [MemberStatus.PENDING_WITHDRAWAL, MemberStatus.WITHDRAWAL_PENDING_PROCESSING],
  },
  {
    value: 'withdrawn',
    label: '退会済み',
    statuses: [MemberStatus.WITHDRAWN, MemberStatus.FORCED_WITHDRAWAL],
  },
  { value: MEMBER_STATUS_FILTER_GATE_STOP, label: GATE_STOP_LABEL, statuses: [] },
];

/** Brand groups (JOYFIT / FIT365) — the axis the 「ブランド」 filter maps to 1:1. */
export const BRAND_GROUP_LABELS: Record<MainBrand, string> = {
  [MainBrand.JOYFIT]: 'JOYFIT',
  [MainBrand.FIT365]: 'FIT365',
};

/** Store sub-brands. Read from the store, never from the member row. */
export const BRAND_LABELS: Record<Brand, string> = {
  [Brand.JOYFIT]: 'JOYFIT',
  [Brand.FIT365]: 'FIT365',
  [Brand.JOYFIT_PLUS]: 'JOYFIT+',
  [Brand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [Brand.JOYFIT24]: 'JOYFIT24',
};

export const MEMBER_STATUS_CLASSES: Record<MemberStatus, string> = {
  [MemberStatus.PROVISIONAL]: 'bg-info/15 text-info border-info/20',
  [MemberStatus.ACTIVE]: 'bg-success/15 text-success border-success/20',
  [MemberStatus.PENDING_SUSPENDED]: 'bg-warning/15 text-warning border-warning/20',
  [MemberStatus.SUSPENDED]: 'bg-warning/15 text-warning border-warning/20',
  [MemberStatus.PENDING_WITHDRAWAL]: 'bg-warning/15 text-warning border-warning/20',
  [MemberStatus.WITHDRAWAL_PENDING_PROCESSING]: 'bg-warning/15 text-warning border-warning/20',
  [MemberStatus.WITHDRAWN]: 'bg-muted text-muted-foreground border-border',
  [MemberStatus.FORCED_WITHDRAWAL]: 'bg-destructive/15 text-destructive border-destructive/20',
};

/**
 * Whether the status badge shows its live-state dot.
 *
 * 退会済み is a closed, inactive state, so it gets no dot (prototype `shouldShowMemberStatusDot`);
 * 強制退会済み is closed for the same reason.
 * Shared between the list column and the detail head-up so the two can never disagree.
 */
export function shouldShowMemberStatusDot(status: MemberStatus): boolean {
  return status !== MemberStatus.WITHDRAWN && status !== MemberStatus.FORCED_WITHDRAWAL;
}

const MEMBER_STATUS_CLASSES_BY_LABEL: Record<string, string> = Object.fromEntries(
  (Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[]).map((status) => [
    MEMBER_STATUS_LABELS[status],
    MEMBER_STATUS_CLASSES[status],
  ]),
);

/**
 * For places (e.g. change history) where the status only arrives as a Japanese label string.
 * Unknown labels fall back to gray.
 */
export function getMemberStatusClassByLabel(label: string): string {
  return MEMBER_STATUS_CLASSES_BY_LABEL[label] ?? 'bg-muted text-muted-foreground border-border';
}

export const BRAND_CLASSES: Record<Brand, string> = {
  [Brand.JOYFIT]: 'bg-blue-100 text-blue-600',
  [Brand.FIT365]: 'bg-green-100 text-green-600',
  [Brand.JOYFIT_PLUS]: 'bg-yellow-100 text-yellow-600',
  [Brand.JOYFIT_YOGA]: 'bg-purple-100 text-purple-600',
  [Brand.JOYFIT24]: 'bg-red-100 text-red-600',
};

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MALE]: '男性',
  [Gender.FEMALE]: '女性',
  [Gender.OTHER]: 'その他',
  [Gender.PREFER_NOT_TO_SAY]: '回答しない',
};

export const MEMO_TYPE_LABELS: Record<MemoType, string> = {
  [MemoType.CAUTION]: '要注意',
  [MemoType.VIP]: 'VIP',
  [MemoType.OTHER]: 'その他',
};

export const GENDER_CLASSES: Record<Gender, string> = {
  [Gender.MALE]: 'bg-gender-male/15 text-gender-male border-gender-male/20',
  [Gender.FEMALE]: 'bg-gender-female/15 text-gender-female border-gender-female/20',
  [Gender.OTHER]: 'bg-muted text-muted-foreground border-muted/20',
  [Gender.PREFER_NOT_TO_SAY]: 'bg-muted text-muted-foreground border-muted/20',
};
