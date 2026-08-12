import { z } from 'zod';

import {
  MANUAL_NOTIFICATION_CHANNEL_OPTIONS,
  MANUAL_NOTIFICATION_PAGE_SIZE_OPTIONS,
  MANUAL_NOTIFICATION_STATUS_OPTIONS,
  MANUAL_NOTIFICATION_TARGET_OPTIONS,
} from '../_constants/manual-notification.constants';

export const ManualNotificationListQuerySchema = z.object({
  page: z.number().int().min(1),
  limit: z
    .number()
    .int()
    .refine((value) => MANUAL_NOTIFICATION_PAGE_SIZE_OPTIONS.includes(value as never)),
  q: z.string().max(100).optional(),
  status: z.enum(MANUAL_NOTIFICATION_STATUS_OPTIONS).optional(),
  channel: z.enum(MANUAL_NOTIFICATION_CHANNEL_OPTIONS).optional(),
  targetType: z.enum(MANUAL_NOTIFICATION_TARGET_OPTIONS).optional(),
  sort: z.enum(['id', 'title', 'status', 'updatedAt']),
  order: z.enum(['asc', 'desc']),
});
