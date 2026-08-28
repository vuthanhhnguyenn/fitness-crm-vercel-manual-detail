import type {
  BlacklistCheckState,
  BlacklistCondition,
  CompanionUpgrade,
  EnrollmentRoute,
  MembershipApplicationPaymentMethod,
  MembershipApplicationStatus,
  RejectionReason,
  TimelineEntry,
} from '@/app/api/_schemas/membership-application.schema';
import { addDays, addHours, subDays, subYears } from 'date-fns';

/** List-level storage row. snake_case to mirror a SQL-shaped backend. */
export type MembershipApplicationRow = {
  id: string;
  applicant_name: string;
  applicant_kana: string;
  status: MembershipApplicationStatus;
  enrollment_route: EnrollmentRoute;
  blacklist_state: BlacklistCheckState;
  brand_id: string;
  brand_name: string;
  store_id: string;
  store_name: string;
  plan_id: string;
  plan_name: string;
  campaign_id: string | null;
  campaign_name: string | null;
  application_date: string;
  contract_start_date: string;
  usage_start_date: string;
  is_minor: boolean;
  updated_at: string;
};

/** Everything the detail screen adds beyond the list row. */
export type MembershipApplicationDetailRow = {
  birth_date: string;
  age: number;
  gender_label: string;
  phone_real: string;
  email_real: string;
  address_real: string;
  face_photo_registered: boolean;
  face_photo_registered_at: string | null;
  blacklist_conditions: BlacklistCondition[];
  monthly_fee: number;
  prepayment_months: number;
  options: string[];
  payment_method: MembershipApplicationPaymentMethod;
  card_last4: string | null;
  enrollment_fee_master_id: string | null;
  parental_consent: boolean;
  parental_consent_at: string | null;
  parental_consent_method: string | null;
  application_source: string;
  proxy_staff_name: string | null;
  proxy_staff_id: string | null;
  agreement_datetime: string | null;
  companion_upgrade: CompanionUpgrade | null;
  /** ⚠️ PROVISIONAL — input to the re-enrolment exemption rule (FR-025a). */
  previous_withdrawal_date: string | null;
  /** ⚠️ PROVISIONAL — a staff-discretionary exemption only takes effect with a reason. */
  staff_exemption_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: RejectionReason | null;
  rejection_supplement: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  same_day_cancel_count: number;
  same_day_cancel_date: string | null;
  timeline: TimelineEntry[];
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
//
// The seed is anchored to the moment the mock DB is first created rather than to
// fixed calendar dates. The list screen defaults to the most recent 7 days
// (FR-007) and the 対応超過 badge is derived from `application_date` against the
// wall clock (FR-011) — fixed 2026-03 dates would make every seeded row both
// invisible under the default filter and permanently overdue.

const SEED_ANCHOR = new Date();

/** ISO 8601 with the +09:00 offset the API contract uses. */
function isoAt(offsetHours: number): string {
  const d = addHours(SEED_ANCHOR, offsetHours);
  const jst = addHours(d, 9);
  return `${jst.toISOString().slice(0, 19)}+09:00`;
}

/** YYYY-MM-DD, `days` from the anchor. */
function dateAt(days: number): string {
  const d = addDays(SEED_ANCHOR, days);
  return d.toISOString().slice(0, 10);
}

/** Birth date for someone who is exactly `age` years old today. */
function birthDateForAge(age: number): string {
  const d = subDays(subYears(SEED_ANCHOR, age), 10);
  return d.toISOString().slice(0, 10);
}

// ─── Store / brand fixtures ───────────────────────────────────────────────────
// Store IDs match `tables/store.table.ts`. Rows span six stores so scope
// filtering is observable: Staff STF-001 is linked to store-001. store-003 and
// store-005 are included too — they're the stores a Manager's default store
// switcher selection (alphabetically-first by name) and an FC-linked Staff
// (STF-010 → fc-001) resolve to, so those accounts must have visible rows too.

// brand_id intentionally equals brand_name (e.g. 'FIT365') — this feature has no
// separate brand-code table to key against, so a second opaque ID would add
// nothing (Constitution V). enrollment-fee-masters and the create-form's brand
// select use this same 'FIT365' | 'JOYFIT' vocabulary.
const S1 = {
  store_id: 'store-001',
  store_name: 'Fit365八潮店',
  brand_id: 'FIT365',
  brand_name: 'FIT365',
};
const S2 = {
  store_id: 'store-002',
  store_name: 'Fit365新宿店',
  brand_id: 'FIT365',
  brand_name: 'FIT365',
};
const S3 = {
  store_id: 'store-003',
  store_name: 'Fit365渋谷店',
  brand_id: 'FIT365',
  brand_name: 'FIT365',
};
const S4 = {
  store_id: 'store-004',
  store_name: 'JOYFIT池袋店',
  brand_id: 'JOYFIT',
  brand_name: 'JOYFIT',
};
const S5 = {
  store_id: 'store-005',
  store_name: 'JOYFIT池袋店',
  brand_id: 'JOYFIT',
  brand_name: 'JOYFIT',
};
const S6 = {
  store_id: 'store-006',
  store_name: 'JOYFIT24 新宿店',
  brand_id: 'JOYFIT',
  brand_name: 'JOYFIT',
};
// store-010 — the only store the seeded Observer account (STF-022) is linked
// to (getAllowedStoreIds resolves Observer scope via staff_linkage same as
// Staff/Trainer). Without a row here, Observer's store-scoped list is always
// empty despite holding MembershipApplicationsView.
const S7 = {
  store_id: 'store-010',
  store_name: 'ジョイフィット静岡店',
  brand_id: 'JOYFIT',
  brand_name: 'JOYFIT',
};

function systemEntry(id: string, hoursAgo: number, content: string): TimelineEntry {
  return { id, kind: 'system', datetime: isoAt(-hoursAgo), operator: 'システム', content };
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

export const SEED_MEMBERSHIP_APPLICATIONS: MembershipApplicationRow[] = [
  {
    id: 'APP-2026-0001',
    applicant_name: '山田 太郎',
    applicant_kana: 'ヤマダ タロウ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S1,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: 'CMP-001',
    campaign_name: '春の入会キャンペーン',
    application_date: isoAt(-2),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(30),
    is_minor: false,
    updated_at: isoAt(-2),
  },
  {
    // Overdue: 未審査 beyond the 24 h threshold. No campaign → campaign_id null.
    id: 'APP-2026-0002',
    applicant_name: '佐藤 花子',
    applicant_kana: 'サトウ ハナコ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S1,
    plan_id: 'PLN-002',
    plan_name: 'デイタイム会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-30),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(20),
    is_minor: false,
    updated_at: isoAt(-30),
  },
  {
    // Multi-condition blacklist match, no withdrawal history.
    id: 'APP-2026-0003',
    applicant_name: '鈴木 一郎',
    applicant_kana: 'スズキ イチロウ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'matched',
    ...S1,
    plan_id: 'PLN-003',
    plan_name: 'ナイト会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-5),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(25),
    is_minor: false,
    updated_at: isoAt(-5),
  },
  {
    // Referral route, re-enrolment exemption qualifies (withdrew 60 days ago).
    id: 'APP-2026-0004',
    applicant_name: '田中 美咲',
    applicant_kana: 'タナカ ミサキ',
    status: 'pending',
    enrollment_route: 'referral',
    blacklist_state: 'no_match',
    ...S1,
    plan_id: 'PLN-004',
    plan_name: 'ウィークエンド会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-8),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(15),
    is_minor: false,
    updated_at: isoAt(-8),
  },
  {
    // Overdue, and a re-enrolment history outside the 180-day window.
    id: 'APP-2026-0005',
    applicant_name: '伊藤 健二',
    applicant_kana: 'イトウ ケンジ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S2,
    plan_id: 'PLN-005',
    plan_name: 'レギュラー会員（学生）',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-26),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(10),
    is_minor: false,
    updated_at: isoAt(-26),
  },
  {
    // Admin-sourced WITH an agreement timestamp; staff-discretionary exemption.
    id: 'APP-2026-0006',
    applicant_name: '松本 奈々',
    applicant_kana: 'マツモト ナナ',
    status: 'pending',
    enrollment_route: 'manual',
    blacklist_state: 'no_match',
    ...S4,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-3),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(28),
    is_minor: false,
    updated_at: isoAt(-3),
  },
  {
    // Admin-sourced MISSING its agreement timestamp — exercises the FR-028 block.
    id: 'APP-2026-0007',
    applicant_name: '青木 太一',
    applicant_kana: 'アオキ タイチ',
    status: 'pending',
    enrollment_route: 'manual',
    blacklist_state: 'no_match',
    ...S1,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-4),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(22),
    is_minor: false,
    updated_at: isoAt(-4),
  },
  {
    // Minor WITH recorded parental consent (JOYFIT minimum 15).
    id: 'APP-2026-0008',
    applicant_name: '若林 みなみ',
    applicant_kana: 'ワカバヤシ ミナミ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S4,
    plan_id: 'PLN-005',
    plan_name: 'レギュラー会員（学生）',
    campaign_id: 'CMP-002',
    campaign_name: '学生割引キャンペーン',
    application_date: isoAt(-6),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(18),
    is_minor: true,
    updated_at: isoAt(-6),
  },
  {
    // Minor WITHOUT consent — the checklist must not report the age item as passed.
    id: 'APP-2026-0009',
    applicant_name: '小川 拓海',
    applicant_kana: 'オガワ タクミ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S6,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-7),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(12),
    is_minor: true,
    updated_at: isoAt(-7),
  },
  {
    // Blacklist comparison could not complete.
    id: 'APP-2026-0010',
    applicant_name: '林 彩花',
    applicant_kana: 'ハヤシ アヤカ',
    status: 'pending',
    enrollment_route: 'referral',
    blacklist_state: 'incomplete',
    ...S1,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: 'CMP-003',
    campaign_name: '友達紹介キャンペーン',
    application_date: isoAt(-9),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(14),
    is_minor: false,
    updated_at: isoAt(-9),
  },
  {
    // JACCS (bank transfer) payer — drives the fee notice and refund guidance.
    id: 'APP-2026-0011',
    applicant_name: '高橋 正男',
    applicant_kana: 'タカハシ マサオ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S2,
    plan_id: 'PLN-002',
    plan_name: 'デイタイム会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-10),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(16),
    is_minor: false,
    updated_at: isoAt(-10),
  },
  {
    // Companion (C区分) upgrade candidate. Usage start deliberately more than
    // two months after contract start so the checklist raises its warning.
    id: 'APP-2026-0012',
    applicant_name: '山内 次郎',
    applicant_kana: 'ヤマウチ ジロウ',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S1,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-11),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(75),
    is_minor: false,
    updated_at: isoAt(-11),
  },
  {
    id: 'APP-2026-0013',
    applicant_name: '前田 由香',
    applicant_kana: 'マエダ ユカ',
    status: 'review',
    enrollment_route: 'mobile',
    blacklist_state: 'matched',
    ...S1,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: 'CMP-002',
    campaign_name: '学生割引キャンペーン',
    application_date: isoAt(-20),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(21),
    is_minor: false,
    updated_at: isoAt(-19),
  },
  {
    // Approved with a future usage start — cancellable.
    id: 'APP-2026-0014',
    applicant_name: '渡辺 由美子',
    applicant_kana: 'ワタナベ ユミコ',
    status: 'approved',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S1,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-48),
    contract_start_date: dateAt(-1),
    usage_start_date: dateAt(26),
    is_minor: false,
    updated_at: isoAt(-46),
  },
  {
    // Decided upstream — read-only in the CRM (FR-060).
    id: 'APP-2026-0015',
    applicant_name: '小林 優子',
    applicant_kana: 'コバヤシ ユウコ',
    status: 'auto_approved',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S4,
    plan_id: 'PLN-003',
    plan_name: 'ナイト会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-72),
    contract_start_date: dateAt(-2),
    usage_start_date: dateAt(24),
    is_minor: false,
    updated_at: isoAt(-72),
  },
  {
    id: 'APP-2026-0016',
    applicant_name: '吉田 恵子',
    applicant_kana: 'ヨシダ ケイコ',
    status: 'rejected',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S2,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-96),
    contract_start_date: dateAt(-3),
    usage_start_date: dateAt(8),
    is_minor: false,
    updated_at: isoAt(-94),
  },
  {
    id: 'APP-2026-0017',
    applicant_name: '山本 直人',
    applicant_kana: 'ヤマモト ナオト',
    status: 'cancelled',
    enrollment_route: 'manual',
    blacklist_state: 'no_match',
    ...S1,
    plan_id: 'PLN-004',
    plan_name: 'ウィークエンド会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-120),
    contract_start_date: dateAt(-4),
    usage_start_date: dateAt(6),
    is_minor: false,
    updated_at: isoAt(-118),
  },
  {
    // Older than the default 7-day range — only visible once the range is widened.
    id: 'APP-2026-0018',
    applicant_name: '石川 雄介',
    applicant_kana: 'イシカワ ユウスケ',
    status: 'approved',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S6,
    plan_id: 'PLN-002',
    plan_name: 'デイタイム会員',
    campaign_id: 'CMP-001',
    campaign_name: '春の入会キャンペーン',
    application_date: isoAt(-24 * 9),
    contract_start_date: dateAt(-8),
    usage_start_date: dateAt(40),
    is_minor: false,
    updated_at: isoAt(-24 * 9 + 2),
  },
  {
    // store-003 — a Manager's default store-switcher selection (alphabetically
    // first among their managed stores) resolves here; must not land empty.
    id: 'APP-2026-0019',
    applicant_name: '加藤 誠',
    applicant_kana: 'カトウ マコト',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S3,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-4),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(30),
    is_minor: false,
    updated_at: isoAt(-4),
  },
  {
    // store-005 — the only store an FC-linked Staff (STF-010 → fc-001) can see.
    id: 'APP-2026-0020',
    applicant_name: '中島 舞',
    applicant_kana: 'ナカジマ マイ',
    status: 'review',
    enrollment_route: 'referral',
    blacklist_state: 'no_match',
    ...S5,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-14),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(20),
    is_minor: false,
    updated_at: isoAt(-13),
  },
  {
    // store-010 — see S7 comment: gives the seeded Observer account a
    // visible row under the default 7-day filter.
    id: 'APP-2026-0021',
    applicant_name: '内田 光',
    applicant_kana: 'ウチダ ヒカル',
    status: 'pending',
    enrollment_route: 'mobile',
    blacklist_state: 'no_match',
    ...S7,
    plan_id: 'PLN-001',
    plan_name: 'レギュラー会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-6),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(20),
    is_minor: false,
    updated_at: isoAt(-6),
  },
  {
    // store-010 — second row, different status so Observer's view exercises
    // more than the pending state.
    id: 'APP-2026-0022',
    applicant_name: '橋本 さくら',
    applicant_kana: 'ハシモト サクラ',
    status: 'review',
    enrollment_route: 'referral',
    blacklist_state: 'no_match',
    ...S7,
    plan_id: 'PLN-002',
    plan_name: 'デイタイム会員',
    campaign_id: null,
    campaign_name: null,
    application_date: isoAt(-12),
    contract_start_date: dateAt(1),
    usage_start_date: dateAt(18),
    is_minor: false,
    updated_at: isoAt(-11),
  },
];

// ─── Detail records ───────────────────────────────────────────────────────────

type DetailOverride = Partial<MembershipApplicationDetailRow>;

const DETAIL_OVERRIDES: Record<string, DetailOverride> = {
  'APP-2026-0003': {
    blacklist_conditions: [
      { condition: 'name_birthdate', label: '氏名＆生年月日一致', blacklist_entry_id: 'BL-0007' },
      { condition: 'phone', label: '電話番号一致', blacklist_entry_id: 'BL-0007' },
    ],
    previous_withdrawal_date: null,
    timeline: [
      systemEntry('tl-0003-2', 5, 'ブラックリスト照合で一致を検出しました。'),
      systemEntry('tl-0003-1', 5, '申請受付（アプリ経由）'),
    ],
  },
  'APP-2026-0004': {
    // ⚠️ PROVISIONAL: within the 180-day re-enrolment window.
    previous_withdrawal_date: dateAt(-60),
    timeline: [systemEntry('tl-0004-1', 8, '申請受付（アプリ経由・紹介コード適用）')],
  },
  'APP-2026-0005': {
    // ⚠️ PROVISIONAL: outside the 180-day re-enrolment window.
    previous_withdrawal_date: dateAt(-300),
    timeline: [systemEntry('tl-0005-1', 26, '申請受付（アプリ経由）')],
  },
  'APP-2026-0006': {
    application_source: '管理画面',
    proxy_staff_name: '管理者A',
    proxy_staff_id: 'STF-001',
    agreement_datetime: isoAt(-3),
    // ⚠️ PROVISIONAL: a staff-discretionary exemption already justified.
    staff_exemption_reason: '店舗判断による特例免除（キャンペーン終了直後の申込）',
    timeline: [
      {
        id: 'tl-0006-1',
        kind: 'system',
        datetime: isoAt(-3),
        operator: '管理者A',
        content: '管理画面から代理申請を登録（入会経路: 手動）',
      },
    ],
  },
  'APP-2026-0007': {
    application_source: '管理画面',
    proxy_staff_name: '管理者A',
    proxy_staff_id: 'STF-001',
    agreement_datetime: null,
    timeline: [
      {
        id: 'tl-0007-1',
        kind: 'system',
        datetime: isoAt(-4),
        operator: '管理者A',
        content: '管理画面から代理申請を登録（入会経路: 手動）',
      },
    ],
  },
  'APP-2026-0008': {
    birth_date: birthDateForAge(16),
    age: 16,
    gender_label: '女性',
    parental_consent: true,
    parental_consent_at: isoAt(-6),
    parental_consent_method: 'アプリ上の確認チェック',
    timeline: [systemEntry('tl-0008-1', 6, '申請受付（アプリ経由）')],
  },
  'APP-2026-0009': {
    birth_date: birthDateForAge(17),
    age: 17,
    gender_label: '男性',
    parental_consent: false,
    timeline: [systemEntry('tl-0009-1', 7, '申請受付（アプリ経由）')],
  },
  'APP-2026-0010': {
    blacklist_conditions: [],
    timeline: [
      systemEntry('tl-0010-2', 9, 'ブラックリスト照合を完了できませんでした。再照合が必要です。'),
      systemEntry('tl-0010-1', 9, '申請受付（アプリ経由・紹介コード適用）'),
    ],
  },
  'APP-2026-0011': {
    payment_method: 'bank_transfer',
    card_last4: null,
    timeline: [systemEntry('tl-0011-1', 10, '申請受付（アプリ経由）')],
  },
  'APP-2026-0012': {
    companion_upgrade: {
      yamauchi_id: 'YM-2023-00412',
      from_classification: 'C',
      to_classification: 'A',
      inherited_visit_count: 48,
      inherited_training_count: 153,
    },
    timeline: [
      systemEntry(
        'tl-0012-2',
        11,
        'Yamauchi-ID（YM-2023-00412）の同伴履歴・トレーニング記録を確認しました。引き継ぎ対象として登録済みです。',
      ),
      systemEntry(
        'tl-0012-1',
        11,
        '申請受付（アプリ経由）。同伴者（C区分）からの正会員昇格申請を検出しました。',
      ),
    ],
  },
  'APP-2026-0013': {
    blacklist_conditions: [
      { condition: 'name_birthdate', label: '氏名＆生年月日一致', blacklist_entry_id: 'BL-0012' },
      { condition: 'address', label: '住所一致', blacklist_entry_id: 'BL-0012' },
    ],
    timeline: [
      systemEntry('tl-0013-2', 19, '審査を開始しました。'),
      systemEntry('tl-0013-1', 20, '申請受付（アプリ経由）'),
    ],
  },
  'APP-2026-0014': {
    approved_by: '管理者A',
    approved_at: isoAt(-46),
    timeline: [
      {
        id: 'tl-0014-2',
        kind: 'system',
        datetime: isoAt(-46),
        operator: '管理者A',
        content: '入会申請を承認しました。会員登録完了通知を送信しました。',
      },
      {
        id: 'tl-0014-1',
        kind: 'memo',
        datetime: isoAt(-47),
        operator: '管理者A',
        content: '本人確認書類を目視確認済み。',
      },
      systemEntry('tl-0014-0', 48, '申請受付（アプリ経由）'),
    ],
  },
  'APP-2026-0015': {
    approved_by: 'システム（自動承認）',
    approved_at: isoAt(-72),
    timeline: [
      systemEntry(
        'tl-0015-2',
        72,
        'BL照合・年齢チェック完了。要審査ケースに該当しないため自動承認し、会員レコードを生成しました。契約完了メールを送信しました。',
      ),
      systemEntry('tl-0015-1', 72, '申請受付（アプリ経由）'),
    ],
  },
  'APP-2026-0016': {
    rejected_by: '管理者B',
    rejected_at: isoAt(-94),
    rejection_reason: 'identity_incomplete',
    rejection_supplement: '本人確認書類の有効期限切れを確認。',
    timeline: [
      systemEntry(
        'tl-0016-3',
        94,
        '申請者に否認通知を送信しました。保留中の決済情報を解放しました。',
      ),
      {
        id: 'tl-0016-2',
        kind: 'system',
        datetime: isoAt(-94),
        operator: '管理者B',
        content: '否認理由: 本人確認不備。本人確認書類の有効期限切れを確認。',
      },
      systemEntry('tl-0016-1', 96, '申請受付（アプリ経由）'),
    ],
  },
  'APP-2026-0017': {
    application_source: '管理画面',
    proxy_staff_name: '管理者A',
    proxy_staff_id: 'STF-001',
    agreement_datetime: isoAt(-120),
    cancelled_by: '管理者A',
    cancelled_at: isoAt(-118),
    cancellation_reason: '申請者都合により取り消し',
    timeline: [
      {
        id: 'tl-0017-2',
        kind: 'system',
        datetime: isoAt(-118),
        operator: '管理者A',
        content:
          '申請を取り消しました。理由: 申請者都合により取り消し。カード決済の取消処理を実行します（90日以内）。',
      },
      {
        id: 'tl-0017-1',
        kind: 'system',
        datetime: isoAt(-120),
        operator: '管理者A',
        content: '管理画面から代理申請を登録（入会経路: 手動）',
      },
    ],
  },
  'APP-2026-0018': {
    approved_by: '管理者B',
    approved_at: isoAt(-24 * 9 + 2),
    timeline: [
      {
        id: 'tl-0018-2',
        kind: 'system',
        datetime: isoAt(-24 * 9 + 2),
        operator: '管理者B',
        content: '入会申請を承認しました。会員登録完了通知を送信しました。',
      },
      systemEntry('tl-0018-1', 24 * 9, '申請受付（アプリ経由）'),
    ],
  },
};

function defaultDetail(row: MembershipApplicationRow): MembershipApplicationDetailRow {
  const phone = '090-1234-5678';
  const email = `${row.id.toLowerCase().replaceAll('-', '')}@example.jp`;
  return {
    birth_date: birthDateForAge(32),
    age: 32,
    gender_label: '男性',
    phone_real: phone,
    email_real: email,
    address_real: '東京都新宿区西新宿2-8-1 サンプルマンション302',
    face_photo_registered: true,
    face_photo_registered_at: row.application_date,
    blacklist_conditions: [],
    monthly_fee: 7700,
    prepayment_months: row.brand_name === 'FIT365' ? 2 : 1,
    options: ['プロテインサーバー', 'タオルセット'],
    payment_method: 'credit_card',
    card_last4: '1234',
    enrollment_fee_master_id: row.brand_name === 'JOYFIT' ? 'EF001' : null,
    parental_consent: false,
    parental_consent_at: null,
    parental_consent_method: null,
    application_source: row.enrollment_route === 'manual' ? '管理画面' : 'アプリ',
    proxy_staff_name: null,
    proxy_staff_id: null,
    agreement_datetime: null,
    companion_upgrade: null,
    previous_withdrawal_date: null,
    staff_exemption_reason: null,
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
    rejection_supplement: null,
    cancelled_by: null,
    cancelled_at: null,
    cancellation_reason: null,
    same_day_cancel_count: 0,
    same_day_cancel_date: null,
    timeline: [
      {
        id: `tl-${row.id}-1`,
        kind: 'system',
        datetime: row.application_date,
        operator: 'システム',
        content: '申請受付（アプリ経由）',
      },
    ],
  };
}

export function buildSeedDetails(): Record<string, MembershipApplicationDetailRow> {
  const details: Record<string, MembershipApplicationDetailRow> = {};
  for (const row of SEED_MEMBERSHIP_APPLICATIONS) {
    details[row.id] = { ...defaultDetail(row), ...(DETAIL_OVERRIDES[row.id] ?? {}) };
  }
  return details;
}
