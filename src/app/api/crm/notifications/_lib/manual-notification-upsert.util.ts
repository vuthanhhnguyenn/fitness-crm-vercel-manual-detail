import { db } from '@/app/api/_mock-db';
import type { ManualNotificationRow } from '@/app/api/_mock-db/types/manual-notifications.type';
import type {
  ManualNotificationTarget,
  ManualNotificationTargetInput,
  ManualNotificationUpsertBody,
} from '@/app/api/_schemas/manual-notification.schema';

export function getManualNotificationTargetStoreIds(
  target: ManualNotificationTargetInput,
): string[] {
  if (target.type === 'stores') return [...new Set(target.storeIds)];
  if (target.type === 'members') {
    return [
      ...new Set(
        target.memberIds.flatMap((memberId) => {
          const storeId = db.members.get(memberId)?.profile.store_id;
          return storeId ? [storeId] : [];
        }),
      ),
    ];
  }
  const stores = db.stores.getList();
  if (target.type === 'brands' && !target.brands.includes('joyfit_all')) {
    return stores.filter((store) => target.brands.includes(store.brand)).map((store) => store.id);
  }
  return stores.map((store) => store.id);
}

export function manualNotificationRequiresApproval(
  target: ManualNotificationTarget | ManualNotificationTargetInput,
): boolean {
  return target.type !== 'stores' && target.type !== 'members';
}

export type ManualNotificationTargetValidationError = 'not_found' | 'out_of_scope';

export function validateManualNotificationTarget(
  target: ManualNotificationTargetInput,
  allowedStoreIds: string[] | null,
): ManualNotificationTargetValidationError | undefined {
  if (allowedStoreIds !== null && allowedStoreIds.length === 0) return 'out_of_scope';

  if (target.type === 'stores') {
    if (target.storeIds.some((storeId) => !db.stores.getById(storeId))) return 'not_found';
    if (
      allowedStoreIds !== null &&
      target.storeIds.some((storeId) => !allowedStoreIds.includes(storeId))
    ) {
      return 'out_of_scope';
    }
  }

  if (target.type === 'members') {
    for (const memberId of target.memberIds) {
      const storeId = db.members.get(memberId)?.profile.store_id;
      if (!storeId) return 'not_found';
      if (allowedStoreIds !== null && !allowedStoreIds.includes(storeId)) return 'out_of_scope';
    }
  }

  return undefined;
}

export function manualNotificationTargetToInput(
  target: ManualNotificationTarget,
): ManualNotificationTargetInput {
  if (target.type === 'stores') {
    return { type: 'stores', storeIds: target.stores.map((store) => store.id) };
  }
  if (target.type === 'members') {
    return { type: 'members', memberIds: target.members.map((member) => member.id) };
  }
  return target;
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
    if (existing?.status === 'returned' && !manualNotificationRequiresApproval(body.target)) {
      return 'draft';
    }
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
    targetStoreIds: getManualNotificationTargetStoreIds(body.target),
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
