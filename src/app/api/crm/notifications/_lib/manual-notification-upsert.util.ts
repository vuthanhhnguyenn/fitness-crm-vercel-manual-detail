import { db } from '@/app/api/_mock-db';
import type { ManualNotificationRow } from '@/app/api/_mock-db/types/manual-notifications.type';
import type {
  ManualNotificationTarget,
  ManualNotificationTargetInput,
  ManualNotificationUpsertBody,
} from '@/app/api/_schemas/manual-notification.schema';

import { manualNotificationRequiresApproval } from '@/lib/manual-notification-target.util';

/**
 * Spec FR-006 & Prototype:
 * HQ Approval is required when target is:
 *  - "全会員" (all_members)
 *  - a whole brand: "JOYFIT全体" (joyfit_all) or "FIT365" (fit365)
 *  - all JOYFIT sub-brands individually selected (equivalent to joyfit_all)
 * NOTE: Keep in sync with src/app/(private)/manual-notifications/_constants/manual-notification.constants.ts
 */
export function getManualNotificationTargetStoreIds(
  target: ManualNotificationTargetInput,
  allowedStoreIds: readonly string[] | null = null,
): string[] {
  if (target.type === 'stores') return [...new Set(target.storeIds)];
  if (target.type === 'members') {
    return [
      ...new Set(
        target.memberIds.flatMap((memberId) => {
          const storeId = db.members.get(memberId)?.primaryStore.storeId;
          return storeId ? [storeId] : [];
        }),
      ),
    ];
  }
  const stores = db.stores
    .getList()
    .filter((store) => allowedStoreIds === null || allowedStoreIds.includes(store.id));
  if (target.type === 'brands') {
    const JOYFIT_SUB_BRANDS = ['joyfit', 'joyfit24', 'joyfit_yoga', 'joyfit_plus'];
    const brandSet = new Set(
      target.brands.flatMap((b) => (b === 'joyfit_all' ? JOYFIT_SUB_BRANDS : [b])),
    );
    return stores.filter((store) => brandSet.has(store.brand)).map((store) => store.id);
  }
  return stores.map((store) => store.id);
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
      const storeId = db.members.get(memberId)?.primaryStore.storeId;
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
        const name = member
          ? `${member.personalInfo.lastName} ${member.personalInfo.firstName}`
          : id;
        return {
          id,
          name,
          memberNumber: member?.memberNumber,
          storeName: member?.primaryStore.name,
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
    // The PATCH /crm/notifications/{id} route blocks `intent=save` when
    // existing.status === 'pending_approval' (see [id]/route.ts), so we
    // only need to handle `returned` here.
    if (existing?.status === 'returned' && !manualNotificationRequiresApproval(body.target)) {
      return 'draft';
    }
    return existing?.status ?? 'draft';
  }
  if (manualNotificationRequiresApproval(body.target)) return 'pending_approval';
  return body.timing.type === 'immediate' ? 'sending' : 'scheduled';
}

export function buildManualNotificationRow(input: {
  body: ManualNotificationUpsertBody;
  targetCount: number;
  createdByUserId: string;
  existing?: ManualNotificationRow;
  allowedStoreIds?: readonly string[] | null;
}): Omit<ManualNotificationRow, 'id'> {
  const { body, existing, allowedStoreIds = null } = input;
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
    recipientScopeStoreIds:
      existing?.recipientScopeStoreIds ??
      (allowedStoreIds === null ? null : [...new Set(allowedStoreIds)]),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    targetStoreIds: getManualNotificationTargetStoreIds(body.target, allowedStoreIds),
    deletedAt: null,
    ...(existing?.approvedBy ? { approvedBy: existing.approvedBy } : {}),
    ...(existing?.approvedAt ? { approvedAt: existing.approvedAt } : {}),
    ...(body.intent === 'submit'
      ? { returnReason: undefined }
      : existing?.returnReason
        ? { returnReason: existing.returnReason }
        : {}),
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
  if (timing.type === 'recurring' && timing.endAt) {
    if (new Date(timing.endAt).getTime() <= Date.now()) {
      return '終了日は現在時刻より後を指定してください';
    }
  }
  return undefined;
}
