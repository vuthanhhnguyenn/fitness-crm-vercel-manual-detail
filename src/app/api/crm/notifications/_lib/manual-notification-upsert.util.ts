import { db } from '@/app/api/_mock-db';
import type { ManualNotificationRow } from '@/app/api/_mock-db/types/manual-notifications.type';
import type {
  ManualNotificationTarget,
  ManualNotificationTargetInput,
  ManualNotificationUpsertBody,
} from '@/app/api/_schemas/manual-notification.schema';

function getTargetStoreIds(target: ManualNotificationTargetInput): string[] {
  return target.type === 'stores' ? target.storeIds : [];
}

function manualNotificationRequiresApproval(
  target: ManualNotificationTarget | ManualNotificationTargetInput,
): boolean {
  return (
    target.type === 'all_members' ||
    (target.type === 'brands' && target.brands.includes('joyfit_all'))
  );
}

export function isManualNotificationTargetOutOfScope(
  target: ManualNotificationTargetInput,
  allowedStoreIds: string[] | null,
): boolean {
  return (
    allowedStoreIds !== null &&
    target.type === 'stores' &&
    target.storeIds.some((storeId) => !allowedStoreIds.includes(storeId))
  );
}

function resolveManualNotificationTarget(
  target: ManualNotificationTargetInput,
): ManualNotificationTarget {
  if (target.type === 'stores') {
    return {
      type: 'stores',
      stores: target.storeIds.map((id) => ({ id, name: db.stores.getById(id)?.name ?? id })),
    };
  }
  if (target.type === 'members') {
    return {
      type: 'members',
      members: target.memberIds.map((id) => {
        const member = db.members.get(id);
        return {
          id,
          name: member?.basic_info.name_kanji ?? id,
          memberNumber: member?.basic_info.member_number,
          storeName: member?.profile.store_name,
        };
      }),
    };
  }
  return target;
}

function resolveManualNotificationStatus(
  body: ManualNotificationUpsertBody,
  existing?: ManualNotificationRow,
): ManualNotificationRow['status'] {
  if (body.intent === 'save') {
    return existing?.status === 'pending_approval' ? 'draft' : (existing?.status ?? 'draft');
  }
  if (manualNotificationRequiresApproval(body.target)) return 'pending_approval';
  return body.timing.type === 'immediate' ? 'sending' : 'scheduled';
}

export function buildManualNotificationRow(input: {
  body: ManualNotificationUpsertBody;
  targetCount: number;
  createdByUserId: string;
  existing?: ManualNotificationRow;
}): Omit<ManualNotificationRow, 'id'> {
  const { body, existing } = input;
  const now = new Date().toISOString();
  return {
    title: body.title,
    target: resolveManualNotificationTarget(body.target),
    channels: [...body.channels],
    contents: body.contents,
    timing: body.timing,
    targetCount: input.targetCount,
    status: resolveManualNotificationStatus(body, existing),
    requiresApproval: manualNotificationRequiresApproval(body.target),
    createdByUserId: existing?.createdByUserId ?? input.createdByUserId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    targetStoreIds: getTargetStoreIds(body.target),
    deletedAt: null,
    ...(existing?.approvedBy ? { approvedBy: existing.approvedBy } : {}),
    ...(existing?.approvedAt ? { approvedAt: existing.approvedAt } : {}),
    ...(existing?.returnReason ? { returnReason: existing.returnReason } : {}),
    ...(existing?.deliveryResult ? { deliveryResult: existing.deliveryResult } : {}),
  };
}

export function validateManualNotificationTiming(
  timing: ManualNotificationRow['timing'],
): string | undefined {
  if (timing.type === 'immediate') return undefined;
  const startAt = timing.type === 'scheduled' ? timing.scheduledAt : timing.startAt;
  if (new Date(startAt).getTime() <= Date.now()) {
    return '配信日時は現在時刻より後を指定してください';
  }
  return undefined;
}
