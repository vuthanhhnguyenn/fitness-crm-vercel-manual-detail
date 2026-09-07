import { db } from '@/app/api/_mock-db';
import type { ManualNotificationRow } from '@/app/api/_mock-db/types/manual-notifications.type';
import type {
  GetManualNotificationFormConfigResponse,
  ManualNotificationTarget,
  ManualNotificationTargetInput,
} from '@/app/api/_schemas/manual-notification.schema';

import {
  type ManualNotificationTargetLike,
  type NotificationMemberLike,
  getMatchingMemberIds,
} from '@/lib/manual-notification-target.util';

type TargetPreviewCounts = GetManualNotificationFormConfigResponse['targetPreviewCounts'];

function memberSubBrand(member: NotificationMemberLike): string | undefined {
  return db.stores.getById(member.store_id)?.brand;
}

function notificationMembers(): NotificationMemberLike[] {
  return db.members.getList();
}

function countMembersForTarget(
  target: ManualNotificationTargetInput,
  allowedStoreIds: readonly string[] | null = null,
  now = new Date(),
): number {
  return getMatchingMemberIds(notificationMembers(), target as ManualNotificationTargetLike, {
    resolveSubBrand: memberSubBrand,
    allowedStoreIds,
    now,
  }).length;
}

function targetToInput(target: ManualNotificationTarget): ManualNotificationTargetInput {
  if (target.type === 'stores') {
    return { type: 'stores', storeIds: target.stores.map((store) => store.id) };
  }
  if (target.type === 'members') {
    return { type: 'members', memberIds: target.members.map((member) => member.id) };
  }
  return target;
}

/** Recalculate a row using the immutable recipient scope captured when its creator saved it. */
export function getManualNotificationRowTargetCount(row: ManualNotificationRow): number {
  return countMembersForTarget(targetToInput(row.target), row.recipientScopeStoreIds);
}

function countByStore(allowedStoreIds: readonly string[] | null): Record<string, number> {
  const counts: Record<string, number> = {};
  const members = notificationMembers();
  for (const member of members) {
    if (member.status !== 'active') continue;
    if (allowedStoreIds !== null && !allowedStoreIds.includes(member.store_id)) continue;
    counts[member.store_id] = (counts[member.store_id] ?? 0) + 1;
  }
  return counts;
}

function countByBrand(allowedStoreIds: readonly string[] | null): TargetPreviewCounts['brands'] {
  const brands: Array<keyof TargetPreviewCounts['brands']> = [
    'joyfit_all',
    'joyfit',
    'joyfit24',
    'joyfit_yoga',
    'joyfit_plus',
    'fit365',
  ];
  return Object.fromEntries(
    brands.map((brand) => [
      brand,
      countMembersForTarget({ type: 'brands', brands: [brand] }, allowedStoreIds),
    ]),
  ) as TargetPreviewCounts['brands'];
}

function countByContractType(
  allowedStoreIds: readonly string[] | null,
): TargetPreviewCounts['contractType'] {
  const contractTypes: Array<keyof TargetPreviewCounts['contractType']> = [
    'regular',
    'one_day_member',
    'family',
  ];
  return Object.fromEntries(
    contractTypes.map((contractType) => [
      contractType,
      countMembersForTarget({ type: 'contract_type', contractType }, allowedStoreIds),
    ]),
  ) as TargetPreviewCounts['contractType'];
}

function countDynamicAttributes(
  allowedStoreIds: readonly string[] | null,
): TargetPreviewCounts['dynamicAttributes'] {
  const attributes: Array<keyof TargetPreviewCounts['dynamicAttributes']> = [
    'unpaid',
    'dormant',
    'withdrawal_pending',
    'birthday_month',
    'trial',
  ];
  return Object.fromEntries(
    attributes.map((attribute) => [
      attribute,
      countMembersForTarget({ type: 'dynamic_attribute', attribute }, allowedStoreIds),
    ]),
  ) as TargetPreviewCounts['dynamicAttributes'];
}

export function getManualNotificationFormPreviewCounts(
  allowedStoreIds: readonly string[] | null = null,
): TargetPreviewCounts {
  return {
    allMembers: countMembersForTarget({ type: 'all_members' }, allowedStoreIds),
    brands: countByBrand(allowedStoreIds),
    stores: countByStore(allowedStoreIds),
    contractType: countByContractType(allowedStoreIds),
    membershipDuration: countMembersForTarget(
      { type: 'membership_duration', condition: 'within', months: 3 },
      allowedStoreIds,
    ),
    dynamicAttributes: countDynamicAttributes(allowedStoreIds),
  };
}

export function countManualNotificationTarget(
  target: ManualNotificationTargetInput,
  allowedStoreIds: readonly string[] | null = null,
): number {
  return countMembersForTarget(target, allowedStoreIds);
}
