import { db } from '@/app/api/_mock-db';
import type { MemberListItem } from '@/app/api/_schemas/member.schema';
import type { ManualNotificationTargetInput } from '@/app/api/_schemas/manual-notification.schema';

import type { GetManualNotificationFormConfigResponse } from '@/app/api/_schemas/manual-notification.schema';

type TargetPreviewCounts = GetManualNotificationFormConfigResponse['targetPreviewCounts'];

const ACTIVE_STATUSES = new Set<MemberListItem['status']>(['active']);
const PENDING_WITHDRAWAL_STATUSES = new Set<MemberListItem['status']>([
  'pending_withdrawal',
]);

const JOYFIT_SUB_BRANDS = ['joyfit', 'joyfit24', 'joyfit_yoga', 'joyfit_plus'] as const;
type JoyfitSubBrand = (typeof JOYFIT_SUB_BRANDS)[number];

function isJoyfitSubBrand(brand: string): brand is JoyfitSubBrand {
  return (JOYFIT_SUB_BRANDS as readonly string[]).includes(brand);
}

/** Resolve the sub-brand through the member's primary store. */
function memberSubBrand(m: MemberListItem): string | undefined {
  const store = db.stores.getById(m.store_id);
  return store?.brand;
}

/**
 * Count members that match a single target selector. Reads the same list
 * projection that the /crm/members list endpoint serves, so the totals
 * stay in lockstep with what a user would see when they open the
 * 「対象会員を選択」 dialog.
 */
function countMembersForTarget(target: ManualNotificationTargetInput): number {
  const members = db.members.getList();
  const storeIds = new Set(target.type === 'stores' ? target.storeIds : []);
  const memberIds = new Set(target.type === 'members' ? target.memberIds : []);

  return members.filter((m) => {
    switch (target.type) {
      case 'all_members':
        return ACTIVE_STATUSES.has(m.status);
      case 'brands': {
        if (!ACTIVE_STATUSES.has(m.status)) return false;
        // 'joyfit_all' is a logical OR over every JOYFIT sub-brand
        // (see the cross-ref in manual-notification-upsert.util.ts:30-31).
        // Members carry brand_group only, so we resolve the sub-brand
        // through their primary store before comparing — same approach
        // as countActiveMembersByBrandGroup and
        // getManualNotificationTargetStoreIds.
        const brandSet: Set<string> = new Set(target.brands);
        if (brandSet.has('joyfit_all')) {
          for (const b of JOYFIT_SUB_BRANDS) brandSet.add(b);
        }
        if (brandSet.has(m.brand_group)) return true;
        const sub = memberSubBrand(m);
        return sub !== undefined && brandSet.has(sub);
      }
      case 'stores':
        // Match the live preview counts (active members only) so the
        // post-save `targetCount` agrees with what the form showed.
        return ACTIVE_STATUSES.has(m.status) && storeIds.has(m.store_id);
      case 'contract_type':
        if (!ACTIVE_STATUSES.has(m.status)) return false;
        return m.contract_type === target.contractType;
      case 'membership_duration': {
        if (!ACTIVE_STATUSES.has(m.status)) return false;
        if (!m.joined_at) return false;
        const joined = new Date(m.joined_at);
        const now = new Date();
        const diffMonths =
          (now.getFullYear() - joined.getFullYear()) * 12 +
          (now.getMonth() - joined.getMonth()) -
          (now.getDate() < joined.getDate() ? 1 : 0);
        return target.condition === 'within' ? diffMonths <= target.months : diffMonths >= target.months;
      }
      case 'dynamic_attribute': {
        switch (target.attribute) {
          case 'unpaid':
            return m.has_unpaid === true;
          case 'dormant':
            return !m.last_visit_date;
          case 'withdrawal_pending':
            return PENDING_WITHDRAWAL_STATUSES.has(m.status);
          // birthday_month / trial don't have a 1:1 list-item field yet —
          // they fall back to the static seed estimate. Once the members
          // list endpoint exposes these, replace with a real predicate.
          case 'birthday_month':
          case 'trial':
            return false;
        }
      }
      case 'members':
        return memberIds.has(m.id);
    }
  }).length;
}

/**
 * Per-store headcount, used by the FE preview to sum the actual recipients
 * when multiple stores are selected. Computed once and shipped with the
 * form-config response so the form doesn't re-aggregate per keystroke.
 */
function countActiveMembersPerStore(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of db.members.getList()) {
    if (!ACTIVE_STATUSES.has(m.status)) continue;
    counts[m.store_id] = (counts[m.store_id] ?? 0) + 1;
  }
  return counts;
}

function countActiveMembersByBrandGroup(): TargetPreviewCounts['brands'] {
  const counts: TargetPreviewCounts['brands'] = {
    joyfit_all: 0,
    joyfit: 0,
    joyfit24: 0,
    joyfit_yoga: 0,
    joyfit_plus: 0,
    fit365: 0,
  };
  for (const m of db.members.getList()) {
    if (!ACTIVE_STATUSES.has(m.status)) continue;
    if (m.brand_group === 'joyfit') {
      const sub = memberSubBrand(m);
      counts.joyfit_all += 1;
      if (sub && isJoyfitSubBrand(sub)) {
        counts[sub] += 1;
      }
    } else if (m.brand_group === 'fit365') {
      counts.fit365 += 1;
    }
  }
  return counts;
}

function countActiveMembersByContractType(): TargetPreviewCounts['contractType'] {
  const counts: TargetPreviewCounts['contractType'] = {
    regular: 0,
    one_day_member: 0,
    family: 0,
  };
  for (const m of db.members.getList()) {
    if (!ACTIVE_STATUSES.has(m.status)) continue;
    if (m.contract_type === 'regular') counts.regular += 1;
    else if (m.contract_type === 'one_day_member') counts.one_day_member += 1;
    else if (m.contract_type === 'family') counts.family += 1;
  }
  return counts;
}

/**
 * 「入会後X月」 within 3 months — same default the form pre-fills. Acts as a
 * baseline the FE can keep showing on the form-config summary before the
 * user picks another (condition, months) pair, at which point the form
 * re-aggregates against the live roster.
 */
function countActiveMembersWithin3Months(): number {
  return db.members
    .getList()
    .filter((m) => ACTIVE_STATUSES.has(m.status) && m.joined_at)
    .filter((m) => {
      const joined = new Date(m.joined_at!);
      const now = new Date();
      const diffMonths =
        (now.getFullYear() - joined.getFullYear()) * 12 +
        (now.getMonth() - joined.getMonth()) -
        (now.getDate() < joined.getDate() ? 1 : 0);
      return diffMonths <= 3;
    }).length;
}

function countDynamicAttributes(): TargetPreviewCounts['dynamicAttributes'] {
  let unpaid = 0;
  let dormant = 0;
  let withdrawal_pending = 0;
  // FR-003: 「直近90日間来館がない」 — count active members whose last
  // visit was more than 90 days ago (members without any visit history
  // are also dormant, since "never visited" certainly clears the bar).
  const dormantCutoff = new Date();
  dormantCutoff.setDate(dormantCutoff.getDate() - 90);
  for (const m of db.members.getList()) {
    if (!ACTIVE_STATUSES.has(m.status) && !PENDING_WITHDRAWAL_STATUSES.has(m.status)) continue;
    if (m.has_unpaid) unpaid += 1;
    if (!m.last_visit_date || new Date(m.last_visit_date) < dormantCutoff) {
      dormant += 1;
    }
    if (PENDING_WITHDRAWAL_STATUSES.has(m.status)) withdrawal_pending += 1;
  }
  return {
    unpaid,
    dormant,
    withdrawal_pending,
    // No field on the list item yet — leave at 0; the FE has its own
    // static estimate if it needs to surface these in the summary banner.
    birthday_month: 0,
    trial: 0,
  };
}

/**
 * Aggregated counts surfaced via /crm/notifications/form-config. All fields
 * are derived from the live member roster so the form can render
 * per-store, per-brand, per-contract-type, per-membership-window, and
 * per-attribute previews without a follow-up call.
 *
 * `membershipDuration` is a single estimate pinned to the form's default
 * window (入会後3ヶ月以内) because the FE exposes only one
 * (condition, months) selector at a time. A future per-window breakdown
 * (or a dedicated count endpoint) would supersede this scalar.
 */
export function getManualNotificationFormPreviewCounts(): TargetPreviewCounts {
  const allMembers = db.members.getList().filter((m) => ACTIVE_STATUSES.has(m.status)).length;
  return {
    allMembers,
    brands: countActiveMembersByBrandGroup(),
    stores: countActiveMembersPerStore(),
    contractType: countActiveMembersByContractType(),
    membershipDuration: countActiveMembersWithin3Months(),
    dynamicAttributes: countDynamicAttributes(),
  };
}

export function countManualNotificationTarget(
  target: ManualNotificationTargetInput,
): number {
  return countMembersForTarget(target);
}
