/**
 * Pure target-matching helpers for manual notifications, shared between the
 * server (post-save `targetCount` / preview counts) and the client (live
 * 「対象件数（推計）」 for the membership_duration selector).
 *
 * Lives outside `src/app/api` on purpose: it must not import the mock `db`,
 * Next.js, or the OpenAPI-generated client, so both sides can call the exact
 * same predicate without drifting. Member/target types stay structural so the
 * util never becomes the reason BE rows and FE list items need the same shape.
 */

const MANUAL_NOTIFICATION_ACTIVE_STATUSES = ['active'] as const;
const MANUAL_NOTIFICATION_PENDING_WITHDRAWAL_STATUSES = ['pending_withdrawal'] as const;

export const MANUAL_NOTIFICATION_JOYFIT_SUB_BRANDS = [
  'joyfit',
  'joyfit24',
  'joyfit_yoga',
  'joyfit_plus',
] as const;

export const MANUAL_NOTIFICATION_BRANDS = [
  'joyfit_all',
  ...MANUAL_NOTIFICATION_JOYFIT_SUB_BRANDS,
  'fit365',
] as const;

/** FR-003: 「直近90日間来館がない」 — dormant members are active/pending members with no visit in the window. */
const MANUAL_NOTIFICATION_DORMANT_DAYS = 90;

export type NotificationMemberLike = {
  id: string;
  status: string;
  contract_type: string;
  store_id: string;
  /** Business brand group (JOYFIT / FIT365). Only the member's primary store carries the sub-brand. */
  brand_group?: string;
  joined_at?: string | null;
  last_visit_date?: string | null;
  date_of_birth?: string | null;
  has_unpaid?: boolean;
};

export type ManualNotificationTargetLike =
  | { type: 'all_members' }
  | { type: 'brands'; brands: string[] }
  | { type: 'stores'; storeIds: string[] }
  | { type: 'contract_type'; contractType: string }
  | { type: 'membership_duration'; condition: 'within' | 'at_least'; months: number }
  | {
      type: 'dynamic_attribute';
      attribute: 'unpaid' | 'dormant' | 'withdrawal_pending' | 'birthday_month' | 'trial';
    }
  | { type: 'members'; memberIds: string[] };

export function getManualNotificationSelectedBrand<TBrand extends string>(
  brands: readonly TBrand[] | undefined,
): TBrand | undefined {
  return brands?.[0];
}

export function manualNotificationRequiresApproval(
  target: Pick<ManualNotificationTargetLike, 'type'> & {
    brands?: readonly string[];
  },
): boolean {
  if (target.type === 'all_members') return true;
  if (target.type !== 'brands') return false;

  const selectedBrand = getManualNotificationSelectedBrand(target.brands);
  return selectedBrand === 'joyfit_all' || selectedBrand === 'fit365';
}

interface ManualNotificationTargetMatchOptions {
  /** Resolve a member's store sub-brand (used for the `brands` selector only). */
  resolveSubBrand?: (member: NotificationMemberLike) => string | undefined;
  /** Injectable clock for deterministic dormant / membership-window math. Defaults to now. */
  now?: Date;
  /** Restrict broad selectors to the caller's effective stores. `null` means unrestricted. */
  allowedStoreIds?: readonly string[] | null;
}

const activeStatuses = new Set<string>(MANUAL_NOTIFICATION_ACTIVE_STATUSES);
const pendingWithdrawalStatuses = new Set<string>(MANUAL_NOTIFICATION_PENDING_WITHDRAWAL_STATUSES);

function isActive(member: NotificationMemberLike): boolean {
  return activeStatuses.has(member.status);
}

function isAllowedStore(
  member: NotificationMemberLike,
  allowedStoreIds: readonly string[] | null | undefined,
): boolean {
  return allowedStoreIds === undefined || allowedStoreIds === null
    ? true
    : allowedStoreIds.includes(member.store_id);
}

function monthElapsed(joined: Date, now: Date): number {
  return (
    (now.getFullYear() - joined.getFullYear()) * 12 +
    (now.getMonth() - joined.getMonth()) -
    (now.getDate() < joined.getDate() ? 1 : 0)
  );
}

function getManualNotificationDormantCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - MANUAL_NOTIFICATION_DORMANT_DAYS);
  return cutoff;
}

/** A member counts as dormant when they have never visited, or last visited before the 90-day cutoff. */
function isManualNotificationDormant(member: NotificationMemberLike, now = new Date()): boolean {
  if (!member.last_visit_date) return true;
  return new Date(member.last_visit_date) < getManualNotificationDormantCutoff(now);
}

function matchesManualNotificationTarget(
  member: NotificationMemberLike,
  target: ManualNotificationTargetLike,
  options: ManualNotificationTargetMatchOptions = {},
): boolean {
  const resolveSubBrand = options.resolveSubBrand;
  const now = options.now ?? new Date();

  if (!isAllowedStore(member, options.allowedStoreIds)) return false;

  switch (target.type) {
    case 'all_members':
      return isActive(member);
    case 'brands': {
      if (!isActive(member)) return false;
      const brandSet = new Set<string>(target.brands);
      if (brandSet.has('joyfit_all')) {
        for (const brand of MANUAL_NOTIFICATION_JOYFIT_SUB_BRANDS) brandSet.add(brand);
      }
      const subBrand = resolveSubBrand?.(member);
      if (subBrand !== undefined) return brandSet.has(subBrand);
      return member.brand_group !== undefined && brandSet.has(member.brand_group);
    }
    case 'stores': {
      if (!isActive(member)) return false;
      const storeIds = new Set(target.storeIds);
      return storeIds.has(member.store_id);
    }
    case 'contract_type':
      return isActive(member) && member.contract_type === target.contractType;
    case 'membership_duration': {
      if (!isActive(member) || !member.joined_at) return false;
      const elapsed = monthElapsed(new Date(member.joined_at), now);
      return target.condition === 'within' ? elapsed <= target.months : elapsed >= target.months;
    }
    case 'dynamic_attribute': {
      if (target.attribute === 'trial') {
        // The Phase 1 member fixture uses provisional rows as deterministic
        // trial visitors. A production API will provide an explicit audience
        // eligibility field when the backend contract is available.
        return member.status === 'provisional';
      }
      if (target.attribute === 'birthday_month') {
        if (!isActive(member) || !member.date_of_birth) return false;
        const birthday = new Date(`${member.date_of_birth}T00:00:00`);
        return !Number.isNaN(birthday.getTime()) && birthday.getMonth() === now.getMonth();
      }
      // Same gate as the form-config preview counts: dynamic attributes are
      // only meaningful for active / pending-withdrawal members.
      if (!isActive(member) && !pendingWithdrawalStatuses.has(member.status)) return false;
      switch (target.attribute) {
        case 'unpaid':
          return member.has_unpaid === true;
        case 'dormant':
          return isManualNotificationDormant(member, now);
        case 'withdrawal_pending':
          return pendingWithdrawalStatuses.has(member.status);
      }
    }
    case 'members': {
      const memberIds = new Set(target.memberIds);
      return isActive(member) && memberIds.has(member.id);
    }
  }
}

export function getMatchingMemberIds(
  members: readonly NotificationMemberLike[],
  target: ManualNotificationTargetLike,
  options: ManualNotificationTargetMatchOptions = {},
): string[] {
  return members
    .filter((member) => matchesManualNotificationTarget(member, target, options))
    .map((member) => member.id);
}
