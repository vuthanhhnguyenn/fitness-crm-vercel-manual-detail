import type { ContractsRecord } from '@/app/api/_mock-db/types/contracts.type';
import type { FamilyRelationship } from '@/app/api/_schemas/family-registration.schema';
import type {
  Brand as BrandType,
  ContractType,
  Gender,
  GetMemberDetailResponse,
  MainBrand as MainBrandType,
  MemberBasicInfo,
  MemberStatus,
  MemberType as MemberTypeEnum,
  NotificationPreference,
  NotificationTopic,
} from '@/app/api/_schemas/member.schema';

import { Brand, MainBrand } from '@/lib/api/types.gen';

export const DEFAULT_MEMBER_MAIN_CONTRACT: string = 'レギュラー会員';

export function familyRelationshipToJa(rel: FamilyRelationship): string {
  const labels: Record<FamilyRelationship, string> = {
    spouse: '配偶者',
    child: '子',
    parent: '親',
    sibling: '兄弟',
    grandparent: '祖父母',
    grandchild: '孫',
  };
  return labels[rel] ?? rel;
}

export interface GetMembersResponseMember {
  id: string;
  old_member_number: string;
  member_number: string;
  name_kanji: string;
  name_kana: string;
  member_type: MemberTypeEnum;
  contract_type: ContractType;
  status: MemberStatus;
  store_name: string;
  store_id: string;
  brand_group: MainBrandType;
  contract_name: string;
  contract_id: string;
  joined_at: string;
  last_visit_date?: string;
  has_unpaid: boolean;
  has_gate_stop: boolean;
  promotion_code?: string;
  phone: string;
  email: string;
  /**
   * A-01 FR-015 — projected for the blacklist registration Sheet's identity card
   * (spec Q-04). `has_blacklist` is added by the route layer, which is the only place
   * with access to the blacklist table.
   */
  date_of_birth?: string | null;
  face_photo_url?: string | null;
  has_blacklist?: boolean;
}

export interface MemberListMeta {
  contract_id: string;
  contract_name: string;
  contract_type: ContractType;
  last_visit_date?: string;
  has_unpaid: boolean;
  promotion_code?: string;
}

export type Member = GetMemberDetailResponse;

/** Internal mock-only member health info (edited via health-info route). */
export type MemberHealthInfoInternal = {
  health_status?: string;
  medical_history?: string;
  allergies?: string;
  exercise_restrictions?: string;
};

/** Internal mock-only marketing consent (edited via marketing-consent route). */
export type MemberMarketingConsentInternal = {
  email: boolean;
  sms: boolean;
  push: boolean;
};

/** Internal mock-only individual fee-adjustment record. */
export type MemberFeeAdjustmentInternal = {
  id: string;
  startDate: string;
  endDate: string | null;
  pattern: 'amount' | 'discount_amount' | 'discount_rate' | 'markup_amount';
  value: number;
  reason: string | null;
  setBy: string;
  status: 'active' | 'scheduled' | 'ended';
};

export type MemberRow = Member & {
  _listMeta?: MemberListMeta;
  _healthInfo?: MemberHealthInfoInternal;
  _marketingConsent?: MemberMarketingConsentInternal;
  _feeAdjustments?: MemberFeeAdjustmentInternal[];
};

export type ContractRow = {
  contract_id: string;
  member_id?: string;
  application_id?: string;
  created_at: string;
  data: ContractsRecord;
};

export type MemberProfile = {
  member_type: MemberTypeEnum;
  status: MemberStatus;
  brand: BrandType;
  gender: Gender;
  gate_stop_info?: GetMemberDetailResponse['gateStop'];
};

export function resolveContractTypeFromMemberType(
  memberType: MemberProfile['member_type'],
): ContractType {
  if (memberType === 'family') return 'family';
  if (memberType === 'one_day_member') return 'one_day_member';
  return 'regular';
}

export function resolveBrand(input: string | undefined, fallback: Brand): Brand {
  if (!input) return fallback;
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const brandValues = Object.values(Brand) as string[];
  const matched = brandValues.find((value) => value.toLowerCase() === normalized);
  if (matched) return matched as Brand;
  return fallback;
}

export function resolveMainBrand(
  input: string | undefined,
  fallback: MainBrand = 'fit365',
): MainBrand {
  if (!input) return fallback;
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (normalized === 'fit365') return 'fit365';
  if (normalized.startsWith('joyfit')) return 'joyfit';
  return fallback;
}

/** Monthly fee every seeded main contract carries (see `currentMainContract.plan.monthlyFee`). */
const SEED_MONTHLY_FEE = 8580;

/** Apply a fee-adjustment record to the base monthly fee (A-01 FR-006 patterns). */
export function applyFeeAdjustment(baseMonthlyFee: number, record: MemberFeeAdjustmentInternal) {
  switch (record.pattern) {
    case 'amount':
      return record.value;
    case 'discount_amount':
      return Math.max(0, baseMonthlyFee - record.value);
    case 'discount_rate':
      return Math.round(baseMonthlyFee * (1 - record.value / 100));
    case 'markup_amount':
      return baseMonthlyFee + record.value;
  }
}

/**
 * A-01 FR-006: seed individual fee adjustments for a slice of the members so both the head-up
 * 「個別会費調整中」 badge and the 契約操作 > 個別会費調整 card have data — the remaining members
 * legitimately render the empty state (which a blanket demo list would make unreachable).
 */
function buildSeedFeeAdjustments(id: string, idSuffix: number): MemberFeeAdjustmentInternal[] {
  if (idSuffix % 4 !== 0) return [];

  const startOfMonth = (offsetMonths: number): Date => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + offsetMonths, 1);
  };
  const endOfMonth = (offsetMonths: number): Date => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + offsetMonths + 1, 0);
  };
  const iso = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return [
    {
      id: `${id}-fa-001`,
      startDate: iso(startOfMonth(-6)),
      endDate: iso(endOfMonth(-1)),
      pattern: 'discount_amount',
      value: 1000,
      reason: '長期利用割引',
      setBy: '管理者A',
      status: 'ended',
    },
    {
      id: `${id}-fa-002`,
      startDate: iso(startOfMonth(0)),
      endDate: iso(endOfMonth(5)),
      pattern: 'discount_rate',
      value: 10,
      reason: 'キャンペーン適用',
      setBy: '管理者A',
      status: 'active',
    },
  ];
}

/**
 * The 10 notification topics, in the order the backend defines them. Always all
 * ten, always in this order — read-only in the CRM (QA02 §2.3).
 *
 * `updatedAt` is null for topics the member never touched, and those come back
 * opted-in; the seed keeps a few of each so the "—" rendering is exercised.
 */
const NOTIFICATION_TOPICS: NotificationTopic[] = [
  'visit_stamp',
  'points',
  'achievements',
  'training_reminder',
  'body_measurement_reminder',
  'condition_record',
  'follow_request',
  'news',
  'campaign',
  'reservation_reminder',
];

function buildNotificationPreferences(
  idSuffix: number,
  updatedAtIso: string,
): NotificationPreference[] {
  return NOTIFICATION_TOPICS.map((topic, index) => {
    const untouched = (idSuffix + index) % 3 === 0;
    return {
      topic,
      isOptedIn: untouched ? true : (idSuffix + index) % 4 !== 1,
      updatedAt: untouched ? null : updatedAtIso,
    };
  });
}

export function createMember(
  id: string,
  listMeta: {
    name_kanji: string;
    name_kana: string;
    phone: string;
    email: string;
    birthday: string;
    gender: Gender;
    member_type: MemberProfile['member_type'];
    contract_type: ContractType;
    status: MemberProfile['status'];
    store_id: string;
    store_name: string;
    brand: MemberProfile['brand'];
    joined_at: string;
    contract_id: string;
    contract_name: string;
    last_visit_date?: string;
    has_unpaid: boolean;
    promotion_code?: string;
    emergency_contact_name: string;
    emergency_contact_relationship: string;
    emergency_contact_phone: string;
    in_cancellation_period: boolean;
    is_option_restricted: boolean;
    gate_stop_info?: GetMemberDetailResponse['gateStop'];
    /** Contract usage start date. Drives 退会取り消し cancellability (A-01 FR-005) and the 通常退会 / 入会取消 split (FR-014) */
    usage_start_date?: string;
    /** End of the cancellation-fee period — shown alongside the 移籍申請 block reason */
    cancellation_fee_until?: string;
    /** Active suspension, read by the 休会解除 sheet's read-only block (FR-016) */
    active_suspension?: NonNullable<
      GetMemberDetailResponse['currentMainContract']
    >['activeSuspension'];
    /** Scheduled withdrawal, read by the pending banner and 退会取り消し (FR-020) */
    pending_withdrawal?: NonNullable<
      GetMemberDetailResponse['currentMainContract']
    >['pendingWithdrawal'];
    /** Active reservation penalty (D-01 FR-010), read by the penalty banner and 予約ペナルティ解除 (FR-019) */
    active_penalty?: GetMemberDetailResponse['activePenalty'];
    /** Active blacklist entry — blocks 個人情報削除 and 再入会 (FR-023, FR-024) */
    blacklist_info?: GetMemberDetailResponse['blacklist'];
  },
): MemberRow {
  const [lastName, firstName] = splitJapaneseName(listMeta.name_kanji);
  const [lastNameKana, firstNameKana] = splitJapaneseName(listMeta.name_kana);
  const registeredAtIso = `${listMeta.joined_at}T00:00:00.000Z`;
  // Body-data consent status (mock, prototype-driven): mostly granted, with a few
  // pending / denied members for demo. Derived deterministically from the member id.
  const idSuffix = Number(id.replace(/\D/g, '')) || 0;
  const bodyDataConsentStatus: 'granted' | 'pending' | 'denied' =
    idSuffix % 5 === 3 ? 'denied' : idSuffix % 5 === 1 ? 'pending' : 'granted';
  // A-01 FR-006: the head-up badge and the 個別会費調整 card read the same records, so they agree
  const feeAdjustments = buildSeedFeeAdjustments(id, idSuffix);
  const activeFeeAdjustment = feeAdjustments.find((record) => record.status === 'active');
  return {
    memberId: id,
    memberNumber: id,
    legacyMemberCode: 'O-' + id,
    memberType: listMeta.member_type,
    memberStatus: listMeta.status,
    // Member level carries the brand GROUP only. The sub-brand stays on
    // `primaryStore.brandEnum` below — QA01 §1-4 (backend answer 2026-08-10).
    brandGroup: resolveMainBrand(listMeta.brand),
    personalInfo: {
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      gender: listMeta.gender,
      dateOfBirth: listMeta.birthday,
      email: listMeta.email,
      phone: listMeta.phone,
      postalCode: '',
      prefecture: '',
      city: '',
      streetAddress: '',
      building: '',
      emergencyContact: {
        name: listMeta.emergency_contact_name,
        relationship: listMeta.emergency_contact_relationship,
        phone: listMeta.emergency_contact_phone,
      },
    },
    primaryStore: {
      storeId: listMeta.store_id,
      code: listMeta.store_id,
      name: listMeta.store_name,
      brandEnum: listMeta.brand,
    },
    currentMainContract: {
      contractId: listMeta.contract_id,
      plan: {
        planId: listMeta.contract_id,
        name: listMeta.contract_name,
        code: 'PLAN',
        monthlyFee: 8580,
      },
      store: {
        storeId: listMeta.store_id,
        code: listMeta.store_id,
        name: listMeta.store_name,
      },
      contractStatus: listMeta.status === 'suspended' ? 'suspended' : 'active',
      startDate: listMeta.joined_at,
      // Defaults to the join date: for an ordinary member usage began when they enrolled.
      // Seeded explicitly for members whose usage has not started yet (入会取消 is still possible).
      usageStartDate: listMeta.usage_start_date ?? listMeta.joined_at,
      cancellationFeeUntil: listMeta.cancellation_fee_until,
      activeSuspension: listMeta.active_suspension,
      pendingWithdrawal: listMeta.pending_withdrawal,
      activeFeeAdjustment: activeFeeAdjustment
        ? {
            feeAdjustmentId: activeFeeAdjustment.id,
            startDate: activeFeeAdjustment.startDate,
            endDate: activeFeeAdjustment.endDate ?? undefined,
            adjustedMonthlyFee: applyFeeAdjustment(SEED_MONTHLY_FEE, activeFeeAdjustment),
            reason: activeFeeAdjustment.reason ?? undefined,
          }
        : undefined,
      // FR-S001: members who joined via a referral code are assumed to have a point discount (refund target on suspension)
      activePointDiscount: listMeta.promotion_code
        ? {
            monthlyAmount: 550,
            pointName: listMeta.brand === Brand.FIT365 ? 'ベアレージポイント' : 'ENJOYポイント',
          }
        : undefined,
    },
    contractName: listMeta.contract_name,
    registrationDate: registeredAtIso,
    enrolledAt: listMeta.joined_at,
    // 基本情報 > 入会情報: the campaign applied when the member joined. Kept apart
    // from `currentMainContract.campaign` (today's contract) so a later plan change
    // cannot rewrite history. Deterministic per member id; some members joined
    // without any campaign.
    enrollmentCampaign:
      idSuffix % 3 === 2 ? null : { campaignId: 'CP002', name: '春の入会キャンペーン' },
    lastEntryAt: listMeta.last_visit_date ? `${listMeta.last_visit_date}T18:00:00.000Z` : null,
    joinRoute: listMeta.promotion_code,
    recentVisitCount: 8,
    monthlyVisitCount: 12,
    totalVisitCount: 240,
    unpaidAmount: listMeta.has_unpaid ? 8580 : 0,
    // Replaced per-request by `members.get()`, which resolves the real group from
    // the relationship table; this is only the "no family" baseline.
    family: { role: 'none', parent: null, members: [], remainingSlots: null },
    notificationPreferences: buildNotificationPreferences(idSuffix, registeredAtIso),
    gateStop: listMeta.gate_stop_info ?? null,
    blacklist: listMeta.blacklist_info ?? null,
    activePenalty: listMeta.active_penalty ?? null,
    linking: { status: 'linked', linkedAt: registeredAtIso },
    referral: { inboundFlag: Boolean(listMeta.promotion_code) },
    memo: '',
    anonymizedAt: null,
    bodyDataCrmConsentAt: bodyDataConsentStatus === 'granted' ? registeredAtIso : null,
    bodyDataConsentStatus,
    createdAt: registeredAtIso,
    updatedAt: registeredAtIso,
    constraints: {
      hasUnpaidFee: listMeta.has_unpaid ?? false,
      inCancellationPeriod: listMeta.in_cancellation_period ?? false,
      isOptionRestricted: listMeta.is_option_restricted ?? false,
    },
    _listMeta: {
      contract_id: listMeta.contract_id,
      contract_name: listMeta.contract_name,
      contract_type: listMeta.contract_type,
      last_visit_date: listMeta.last_visit_date,
      has_unpaid: listMeta.has_unpaid,
      promotion_code: listMeta.promotion_code,
    },
    _feeAdjustments: feeAdjustments,
  };
}

/** Build the (snake_case) MemberBasicInfo shape from the new member bundle. */
export function memberToBasicInfo(m: Member): MemberBasicInfo {
  const p = m.personalInfo;
  return {
    id: m.memberId,
    old_member_number: m.legacyMemberCode ?? '',
    member_number: m.memberNumber,
    name_kanji: joinJapaneseName(p.lastName, p.firstName),
    name_kana: joinJapaneseName(p.lastNameKana ?? '', p.firstNameKana ?? ''),
    birthday: p.dateOfBirth ?? '',
    age: calculateAgeFromBirthday(p.dateOfBirth ?? ''),
    gender: p.gender ?? 'other',
    postal_code: p.postalCode,
    prefecture: p.prefecture,
    city: p.city,
    address: p.streetAddress,
    building: p.building,
    phone: p.phone ?? '',
    email: p.email ?? '',
    emergency_contact: p.emergencyContact,
    notes: m.memo,
  };
}

/** Split a space-separated Japanese full name into [last, first]. */
export function splitJapaneseName(full: string): [string, string] {
  const parts = full.trim().split(/[\s　]+/);
  if (parts.length >= 2) return [parts[0]!, parts.slice(1).join(' ')];
  return [full.trim(), ''];
}

/** Join [last, first] back into a display name. */
export function joinJapaneseName(lastName: string, firstName: string): string {
  return [lastName, firstName].filter(Boolean).join(' ');
}

export function calculateAgeFromBirthday(birthday: string): number {
  const [yearText, monthText, dayText] = birthday.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return Math.max(age, 0);
}

export function memberToListItem(m: MemberRow): GetMembersResponseMember {
  const meta = m._listMeta;
  const contractName = meta?.contract_name ?? m.contractName ?? DEFAULT_MEMBER_MAIN_CONTRACT;
  return {
    id: m.memberId,
    old_member_number: m.legacyMemberCode ?? '',
    member_number: m.memberNumber,
    name_kanji: joinJapaneseName(m.personalInfo.lastName, m.personalInfo.firstName),
    name_kana: joinJapaneseName(
      m.personalInfo.lastNameKana ?? '',
      m.personalInfo.firstNameKana ?? '',
    ),
    member_type: m.memberType,
    contract_type: meta?.contract_type ?? 'regular',
    status: m.memberStatus,
    store_id: m.primaryStore.storeId,
    store_name: m.primaryStore.name,
    brand_group: m.brandGroup,
    joined_at: m.enrolledAt,
    phone: m.personalInfo.phone ?? '',
    email: m.personalInfo.email ?? '',
    contract_id: meta?.contract_id ?? m.currentMainContract?.contractId ?? 'MC001',
    contract_name: contractName,
    last_visit_date: meta?.last_visit_date,
    has_unpaid: meta?.has_unpaid ?? false,
    // Read off the gate-stop record, never off `memberStatus` — the two are
    // independent axes (QA01 §1-2).
    has_gate_stop: !!m.gateStop,
    promotion_code: meta?.promotion_code,
    // A-01 FR-015 — projected for the blacklist registration Sheet's identity card
    // (spec Q-04). `has_blacklist` is not set here: it needs the blacklist table, so
    // the route layer adds it, gated to HQ / system.
    date_of_birth: m.personalInfo.dateOfBirth ?? null,
    face_photo_url: m.personalInfo.facePhotoUrl ?? null,
  };
}

export function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function buildPaymentHistory(
  startDate: string,
  monthlyFee: number,
): ContractsRecord['payment_info']['payment_history'] {
  const records = [];
  const start = new Date(startDate);
  const now = new Date();
  let cursor = new Date(start);
  cursor.setDate(27);
  if (cursor < start) cursor = addMonths(cursor, 1);
  let month = 0;
  while (cursor <= now && month < 12) {
    const failed = month === 2;
    records.push({
      date: toIsoDate(cursor),
      amount: monthlyFee,
      breakdown: `月会費 ${monthlyFee.toLocaleString()}円`,
      status: (failed ? 'failed' : 'success') as 'success' | 'failed',
      notes: failed ? '残高不足' : undefined,
    });
    cursor = addMonths(cursor, 1);
    month++;
  }
  return records.reverse();
}

export function buildMemberContractData(input: {
  /** Main contract (plan) master ID — surfaced as `main_contract.id` so the UI can match by ID */
  contract_id?: string;
  plan_name: string;
  start_date: string;
  monthly_fee: number;
  created_at: string;
}): ContractsRecord {
  const start = new Date(input.start_date);
  const penaltyEnd = addMonths(start, 12);
  penaltyEnd.setDate(penaltyEnd.getDate() - 1);

  const campaignStart = toIsoDate(addMonths(start, -1));
  const campaignEnd = toIsoDate(addMonths(start, 5));
  const now = new Date();
  const remainingMs = new Date(campaignEnd).getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  const historyStart = toIsoDate(addMonths(start, -4));
  const historyEnd = toIsoDate(addMonths(start, -1));

  return {
    main_contract: {
      id: input.contract_id ?? '',
      plan_name: input.plan_name,
      monthly_fee: input.monthly_fee,
      start_date: input.start_date,
      penalty_period_end: toIsoDate(penaltyEnd),
      change_history: [
        {
          changed_at: input.created_at,
          previous_plan: '—',
          new_plan: input.plan_name,
          reason: '入会',
        },
      ],
    },
    option_contracts: [],
    option_change_history: [],
    special_contracts: {
      anshin_support: { enrolled: false },
      mutual_use: { enrolled: false },
      security_fee: { enrolled: false },
      maintenance_fee: { enrolled: false },
    },
    payment_info: {
      method: 'credit_card',
      card_number: '**** **** **** 1234',
      cardholder_name: 'TARO YAMADA',
      expiry_date: '12/28',
      billing_day: 27,
      last_payment_date: undefined,
      last_payment_amount: undefined,
      status: 'normal',
      payment_history: buildPaymentHistory(input.start_date, input.monthly_fee),
    },
    unpaid_info: null,
    campaigns: {
      active: [
        {
          id: 'CP002',
          campaign_name: '春の入会キャンペーン',
          period_start: campaignStart,
          period_end: campaignEnd,
          discount_content: '入会金無料',
          remaining_days: remainingDays,
          applied_at: input.start_date,
          status: 'active' as const,
        },
      ],
      history: [
        {
          id: 'CP001',
          campaign_name: '年末特別キャンペーン',
          period_start: historyStart,
          period_end: historyEnd,
          discount_content: '月会費1ヶ月無料',
          applied_at: historyStart,
          status: 'expired' as const,
        },
      ],
    },
  };
}
