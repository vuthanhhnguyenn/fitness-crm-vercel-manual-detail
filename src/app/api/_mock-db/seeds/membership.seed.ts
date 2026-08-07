import type { EkycResult, FamilyRelationship } from '@/app/api/_schemas/family-registration.schema';
import type { ContractType, GetMemberDetailResponse } from '@/app/api/_schemas/member.schema';

import type { GetContractsResponse } from '@/lib/api/types.gen';
import { Brand, MainBrand } from '@/lib/api/types.gen';

export const DEFAULT_MEMBER_MAIN_CONTRACT: string = 'レギュラー会員';

export type MembershipApplicationContractDetails = {
  plan_id: string;
  plan_name: string;
  start_date: string;
  option_ids?: string[];
};

export type MembershipApplicationDetails = Partial<{
  applicant_name: string;
  gender: 'male' | 'female' | 'other';
  blood_type: 'A' | 'B' | 'O' | 'AB' | 'unknown';
  birthday: string;
  applicant_kana: string;
  birth_date: string;
  age: number;
  gender_label: string;
  phone: string;
  phone_real: string;
  email_masked: string;
  email_real: string;
  address: string;
  address_real: string;
  blacklist_conditions: string[];
  usage_start_date: string;
  monthly_fee: number;
  options: string[];
  fee_rows: { label: string; amount: number }[];
  payment_method: string;
  card_last4: string;
  application_source: string;
  updated_at: string;
  parental_consent: boolean;
  proxy_applicant: string;
  agreement_date: string;
  approved_by: string;
  approved_at: string;
  rejected_by: string;
  rejected_at: string;
  rejected_reason: string;
  timeline: {
    id: string;
    kind: 'system' | 'memo';
    date: string;
    operator: string;
    content: string;
  }[];
  applicant_email: string;
  applicant_phone: string;
  applicant_address: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  contract_details: MembershipApplicationContractDetails;
  ekyc: EkycResult;
}>;

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
  member_type: NonNullable<GetMemberDetailResponse['profile']>['member_type'];
  contract_type: ContractType;
  status: NonNullable<GetMemberDetailResponse['profile']>['status'];
  store_name: string;
  store_id: string;
  brand: NonNullable<GetMemberDetailResponse['profile']>['brand'];
  contract_name: string;
  contract_id: string;
  joined_at: string;
  last_visit_date?: string;
  has_unpaid: boolean;
  phone: string;
  email: string;
}

export interface MemberListMeta {
  contract_id: string;
  contract_name: string;
  contract_type: ContractType;
  last_visit_date?: string;
  has_unpaid: boolean;
}

export type Member = GetMemberDetailResponse;
export type MemberRow = Member & { _listMeta?: MemberListMeta };

export type ContractRow = {
  contract_id: string;
  member_id?: string;
  application_id?: string;
  created_at: string;
  data: GetContractsResponse;
};

export type MemberProfile = NonNullable<GetMemberDetailResponse['profile']>;

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

export function createMember(
  id: string,
  listMeta: {
    name_kanji: string;
    name_kana: string;
    phone: string;
    email: string;
    birthday: string;
    gender: 'male' | 'female' | 'other';
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
    emergency_contact_name: string;
    emergency_contact_relationship: string;
    emergency_contact_phone: string;
    in_cancellation_period: boolean;
    is_option_restricted: boolean;
    gate_stop_info?: MemberProfile['gate_stop_info'];
  },
): MemberRow {
  return {
    basic_info: {
      id,
      old_member_number: 'O-' + id,
      member_number: id,
      name_kanji: listMeta.name_kanji,
      name_kana: listMeta.name_kana,
      birthday: listMeta.birthday,
      age: calculateAgeFromBirthday(listMeta.birthday),
      gender: listMeta.gender,
      postal_code: '',
      prefecture: '',
      city: '',
      address: '',
      building: '',
      phone: listMeta.phone,
      email: listMeta.email,
      emergency_contact: {
        name: listMeta.emergency_contact_name,
        relationship: listMeta.emergency_contact_relationship,
        phone: listMeta.emergency_contact_phone,
      },
      notes: '',
    },
    constraints: {
      hasUnpaidFee: listMeta.has_unpaid ?? false,
      inCancellationPeriod: listMeta.in_cancellation_period ?? false,
      isOptionRestricted: listMeta.is_option_restricted ?? false,
    },
    profile: {
      member_type: listMeta.member_type,
      status: listMeta.status,
      contract_id: listMeta.contract_id,
      store_id: listMeta.store_id,
      store_name: listMeta.store_name,
      brand: listMeta.brand,
      main_brand: resolveMainBrand(listMeta.brand),
      joined_at: listMeta.joined_at,
      contract_name: listMeta.contract_name,
      is_black_listed: false,
      gate_stop_info: listMeta.gate_stop_info,
    },
    ekyc: {
      verified: true,
      verified_at: '2024-01-15T10:30:00+09:00',
      document_type: '運転免許証',
    },
    consent: {
      member_agreement: {
        version: '2.1',
        agreed_at: '2024-01-15T10:00:00+09:00',
      },
      privacy_policy: {
        version: '1.5',
        agreed_at: '2024-01-15T10:00:00+09:00',
      },
      optional_agreement: {
        version: '1.0',
        agreed_at: '2024-01-20T14:00:00+09:00',
      },
      marketing_consent: {
        email: true,
        sms: false,
        push: true,
      },
    },
    health_info: {
      health_status: '良好',
      medical_history: '特になし',
      allergies: 'なし',
      exercise_restrictions: '特になし',
    },
    _listMeta: {
      contract_id: listMeta.contract_id,
      contract_name: listMeta.contract_name,
      contract_type: listMeta.contract_type,
      last_visit_date: listMeta.last_visit_date,
      has_unpaid: listMeta.has_unpaid,
    },
  };
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
  const contractName =
    meta?.contract_name ??
    (m.profile as { contract_name?: string | null } | undefined)?.contract_name ??
    DEFAULT_MEMBER_MAIN_CONTRACT;
  return {
    id: m.basic_info.id,
    old_member_number: m.basic_info.old_member_number,
    member_number: m.basic_info.member_number,
    name_kanji: m.basic_info.name_kanji,
    name_kana: m.basic_info.name_kana,
    member_type: m.profile.member_type,
    contract_type: meta?.contract_type ?? 'regular',
    status: m.profile.status,
    store_id: m.profile.store_id,
    store_name: m.profile.store_name,
    brand: m.profile.brand,
    joined_at: m.profile.joined_at,
    phone: m.basic_info.phone,
    email: m.basic_info.email,
    contract_id: meta?.contract_id ?? meta?.contract_id ?? 'MC001',
    contract_name: contractName,
    last_visit_date: meta?.last_visit_date,
    has_unpaid: meta?.has_unpaid ?? false,
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
): GetContractsResponse['payment_info']['payment_history'] {
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
  plan_name: string;
  start_date: string;
  monthly_fee: number;
  created_at: string;
}): GetContractsResponse {
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
