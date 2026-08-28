import type {
  BlacklistDetail,
  BlacklistHistoryEntry,
  BlacklistReasonCategory,
  BlacklistSource,
  BlacklistStaffRef,
} from '@/app/api/_schemas/blacklist.schema';

import { MemberStatus } from '@/lib/api/types.gen';

import { DEFAULT_MEMBER_MAIN_CONTRACT, type MemberRow, joinJapaneseName } from './membership.seed';

/**
 * The System actor. Auto-registration happens inside the forced-withdrawal batch
 * (A-01 FR-016), so its history events carry `actor: null` while the entry itself
 * still names System as the registrant.
 */
export const BLACKLIST_SYSTEM_STAFF: BlacklistStaffRef = {
  staff_id: 'stf-system',
  display_name: 'System',
};

const HQ_STAFF: BlacklistStaffRef[] = [
  { staff_id: 'stf-001', display_name: '佐藤 花子' },
  { staff_id: 'stf-002', display_name: '鈴木 次郎' },
  { staff_id: 'stf-003', display_name: '高橋 美咲' },
  { staff_id: 'stf-004', display_name: '田中 健一' },
  { staff_id: 'stf-005', display_name: '伊藤 直子' },
];

/** The four the registration form offers — `equipment_damage` is legacy-only. */
const FORM_REASONS: BlacklistReasonCategory[] = ['nuisance', 'unpaid', 'fraudulent_use', 'other'];

const MEMOS = [
  '館内での他会員への迷惑行為。X-01 報告書参照。',
  '退会処理時に未納金が発生したため登録。',
  '不正なICカード利用を確認。',
  null,
];

function isoAt(base: Date, dayOffset: number, hour = 10, minute = 30): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildMember(m: MemberRow): BlacklistDetail['member'] {
  const kana = joinJapaneseName(
    m.personalInfo.lastNameKana ?? '',
    m.personalInfo.firstNameKana ?? '',
  ).trim();
  return {
    member_id: m.memberId,
    member_number: m.memberNumber,
    name: joinJapaneseName(m.personalInfo.lastName, m.personalInfo.firstName),
    name_kana: kana || null,
    legacy_member_code: m.legacyMemberCode ?? null,
    member_type: m.memberType ?? null,
    // Null once a forced-withdrawal contract closes — the normal case here, so the
    // 主契約 badge is omitted rather than rendered blank.
    contract_name: m.currentMainContract ? (m.contractName ?? DEFAULT_MEMBER_MAIN_CONTRACT) : null,
    store_name: m.primaryStore?.name ?? null,
    face_photo_url: m.personalInfo.facePhotoUrl ?? null,
  };
}

function registeredEvent(at: string, actor: BlacklistStaffRef | null, source: BlacklistSource) {
  const event: BlacklistHistoryEntry = {
    event: 'registered',
    occurred_at: at,
    actor,
    source,
  };
  return event;
}

/**
 * Builds the seeded blacklist. Coverage is deliberate, not incidental — every branch the
 * two screens can take has to be reachable from seed data (plan research §10):
 *
 * - both `source` values, with auto rows carrying exactly `['unpaid']`
 * - `unpaid_amount` zero and non-zero (the two renderings of FR-011)
 * - a member with no primary store, one with no current contract, one with no legacy code
 * - **at least one released entry** — the only way to exercise FR-069a/FR-069b at all,
 *   since no list view ever shows one
 * - a legacy row with `reason_categories: []`, so no renderer may assume a first element
 * - more than 25 active rows, so the default page size actually paginates
 */
export function buildBlacklistSeed(members: MemberRow[]): BlacklistDetail[] {
  const rows: BlacklistDetail[] = [];
  const base = new Date('2026-01-01T00:00:00.000Z');

  const forceWithdrawn = members.filter((m) => m.memberStatus === MemberStatus.FORCED_WITHDRAWAL);
  const withdrawn = members.filter((m) => m.memberStatus === MemberStatus.WITHDRAWN);

  // ── Auto-registered (強制退会) ────────────────────────────────────────────
  forceWithdrawn.forEach((m, i) => {
    const registeredAt = isoAt(base, i * 11);
    rows.push({
      id: `bl-fw-${String(i + 1).padStart(3, '0')}`,
      member_id: m.memberId,
      member_number: m.memberNumber,
      member_name: joinJapaneseName(m.personalInfo.lastName, m.personalInfo.firstName),
      store_name: m.primaryStore?.name ?? null,
      source: 'forced_withdrawal',
      // The contract fixes this: auto-registered rows carry exactly ['unpaid'].
      reason_categories: ['unpaid'],
      unpaid_amount: i % 3 === 0 ? (i + 1) * 3300 : 0,
      is_active: true,
      registered_at: registeredAt,
      member: buildMember(m),
      memo: null,
      level: null,
      registered_by: BLACKLIST_SYSTEM_STAFF,
      removed_at: null,
      removed_by: null,
      history: [registeredEvent(registeredAt, null, 'forced_withdrawal')],
    });
  });

  // ── Manually registered (手動登録) ────────────────────────────────────────
  withdrawn.slice(0, 12).forEach((m, i) => {
    const registeredAt = isoAt(base, i * 17 + 5, 14, 5);
    const staff = HQ_STAFF[i % HQ_STAFF.length]!;
    rows.push({
      id: `bl-mn-${String(i + 1).padStart(3, '0')}`,
      member_id: m.memberId,
      member_number: m.memberNumber,
      member_name: joinJapaneseName(m.personalInfo.lastName, m.personalInfo.firstName),
      store_name: m.primaryStore?.name ?? null,
      source: 'manual',
      reason_categories: [FORM_REASONS[i % FORM_REASONS.length]!],
      unpaid_amount: i % 2 === 0 ? 0 : (i + 2) * 1100,
      is_active: true,
      registered_at: registeredAt,
      member: buildMember(m),
      memo: MEMOS[i % MEMOS.length] ?? null,
      level: null,
      registered_by: staff,
      removed_at: null,
      removed_by: null,
      history: [registeredEvent(registeredAt, staff, 'manual')],
    });
  });

  // ── Released entry (FR-069a / FR-069b) ────────────────────────────────────
  // Unreachable from any list by design (FR-033), so without this row the released
  // rendering could never be seen at all.
  const releasedSource = withdrawn[12] ?? withdrawn[0] ?? forceWithdrawn[0];
  if (releasedSource) {
    const registeredAt = isoAt(base, 3, 9, 15);
    const removedAt = isoAt(base, 96, 16, 40);
    const registrar = HQ_STAFF[0]!;
    const releaser = HQ_STAFF[2]!;
    rows.push({
      id: 'bl-released-001',
      member_id: releasedSource.memberId,
      member_number: releasedSource.memberNumber,
      member_name: joinJapaneseName(
        releasedSource.personalInfo.lastName,
        releasedSource.personalInfo.firstName,
      ),
      store_name: releasedSource.primaryStore?.name ?? null,
      source: 'manual',
      reason_categories: ['nuisance'],
      unpaid_amount: 0,
      is_active: false,
      registered_at: registeredAt,
      member: buildMember(releasedSource),
      memo: '本人からの申し出により再確認のうえ解除。',
      level: null,
      registered_by: registrar,
      removed_at: removedAt,
      removed_by: releaser,
      history: [
        registeredEvent(registeredAt, registrar, 'manual'),
        { event: 'removed', occurred_at: removedAt, actor: releaser, source: 'manual' },
      ],
    });
  }

  // ── Migrated legacy row with no recorded reason ───────────────────────────
  // `reason_categories: []` is a real shape the contract allows; it exists here so a
  // renderer that assumes a first element fails in development rather than in review.
  const legacySource = withdrawn[13] ?? withdrawn[1];
  if (legacySource) {
    const registeredAt = isoAt(base, -220, 11, 0);
    rows.push({
      id: 'bl-legacy-001',
      member_id: legacySource.memberId,
      member_number: legacySource.memberNumber,
      member_name: joinJapaneseName(
        legacySource.personalInfo.lastName,
        legacySource.personalInfo.firstName,
      ),
      store_name: null,
      source: 'manual',
      reason_categories: [],
      unpaid_amount: 8800,
      is_active: true,
      registered_at: registeredAt,
      member: { ...buildMember(legacySource), store_name: null, legacy_member_code: null },
      memo: null,
      level: null,
      registered_by: HQ_STAFF[4]!,
      removed_at: null,
      removed_by: null,
      history: [registeredEvent(registeredAt, HQ_STAFF[4]!, 'manual')],
    });
  }

  // Newest first — the list's default ordering is registered_at desc.
  return rows.sort((a, b) => b.registered_at.localeCompare(a.registered_at));
}
