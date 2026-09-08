import type {
  GetCrmNotificationsResponse,
  PatchCrmNotificationsByIdActionData,
} from '@/lib/api/types.gen';

export type ManualNotificationAction = NonNullable<
  PatchCrmNotificationsByIdActionData['body']
>['action'];

type ManualNotificationRow = GetCrmNotificationsResponse['items'][number];

interface ManualNotificationActionPolicy {
  canRequestApproval: boolean;
  canSend: boolean;
  canApprove: boolean;
  canReturn: boolean;
  canResubmit: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function getManualNotificationActionPolicy(
  row: Pick<ManualNotificationRow, 'status' | 'requiresApproval'>,
): ManualNotificationActionPolicy {
  return {
    canRequestApproval: row.status === 'draft' && row.requiresApproval,
    canSend: row.status === 'draft' && !row.requiresApproval,
    canApprove: row.status === 'pending_approval' && row.requiresApproval,
    canReturn: row.status === 'pending_approval' && row.requiresApproval,
    canResubmit: row.status === 'returned' && row.requiresApproval,
    canEdit: ['draft', 'returned', 'pending_approval'].includes(row.status),
    canDelete: ['draft', 'returned'].includes(row.status),
  };
}
