import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const ManualNotificationStatusSchema = z
  .enum(['draft', 'pending_approval', 'returned', 'scheduled', 'sending', 'sent'])
  .openapi({
    title: 'ManualNotificationStatus',
    description: 'Manual notification lifecycle state defined by I-03',
  });

export const ManualNotificationChannelSchema = z.enum(['sms', 'push', 'email', 'in_app']).openapi({
  title: 'ManualNotificationChannel',
  description: 'Manual notification delivery channel',
});

export const ManualNotificationBrandSchema = z
  .enum(['joyfit', 'joyfit24', 'joyfit_yoga', 'joyfit_plus', 'fit365'])
  .openapi({
    title: 'ManualNotificationBrand',
    description: 'Brand or JOYFIT sub-brand defined by I-03',
  });

export const ManualNotificationTargetTypeSchema = z
  .enum(['all_members', 'brands', 'stores', 'contract_type', 'membership_duration'])
  .openapi({
    title: 'ManualNotificationTargetType',
    description: 'Manual notification target segmentation type',
  });

const ManualNotificationStoreSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

const ManualNotificationTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all_members') }),
  z.object({
    type: z.literal('brands'),
    brands: z.array(ManualNotificationBrandSchema).min(1),
  }),
  z.object({
    type: z.literal('stores'),
    stores: z.array(ManualNotificationStoreSchema).min(1),
  }),
  z.object({
    type: z.literal('contract_type'),
    contractTypeId: z.string().min(1),
    contractTypeName: z.string().min(1),
  }),
  z.object({
    type: z.literal('membership_duration'),
    condition: z.enum(['within', 'at_least']),
    months: z.number().int().nonnegative(),
  }),
]);

const ManualNotificationRecurringTimingSchema = z
  .object({
    type: z.literal('recurring'),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }).optional(),
    maxOccurrences: z.number().int().positive().optional(),
  })
  .superRefine((value, context) => {
    if (value.endAt === undefined && value.maxOccurrences === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Recurring timing requires endAt or maxOccurrences',
        path: ['endAt'],
      });
    }

    if (value.endAt !== undefined && new Date(value.endAt) <= new Date(value.startAt)) {
      context.addIssue({
        code: 'custom',
        message: 'endAt must be after startAt',
        path: ['endAt'],
      });
    }
  });

const ManualNotificationTimingSchema = z.union([
  z.object({ type: z.literal('immediate') }),
  z.object({
    type: z.literal('scheduled'),
    scheduledAt: z.string().datetime({ offset: true }),
  }),
  ManualNotificationRecurringTimingSchema,
]);

export const ManualNotificationListItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    target: ManualNotificationTargetSchema,
    channels: z.array(ManualNotificationChannelSchema).min(1),
    timing: ManualNotificationTimingSchema,
    targetCount: z.number().int().nonnegative(),
    status: ManualNotificationStatusSchema,
    requiresApproval: z.boolean(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .openapi({
    title: 'ManualNotificationListItem',
    description: 'Manual notification list projection for I-03',
  });

const ManualNotificationMessagesSchema = z
  .object({
    sms: z.string().optional(),
    push: z.string().optional(),
    email: z.string().optional(),
    in_app: z.string().optional(),
  })
  .openapi({ title: 'ManualNotificationMessages' });

const ManualNotificationChannelResultSchema = z.object({
  channel: ManualNotificationChannelSchema,
  deliveredCount: z.number().int().nonnegative(),
  reachedCount: z.number().int().nonnegative().optional(),
  openedCount: z.number().int().nonnegative().optional(),
});

const ManualNotificationDeliveryResultSchema = z.object({
  deliveredAt: z.string().datetime({ offset: true }).optional(),
  deliveredCount: z.number().int().nonnegative(),
  reachedCount: z.number().int().nonnegative().optional(),
  openedCount: z.number().int().nonnegative().optional(),
  channelResults: z.array(ManualNotificationChannelResultSchema).optional(),
});

export const ManualNotificationDetailSchema = ManualNotificationListItemSchema.extend({
  messages: ManualNotificationMessagesSchema,
  createdAt: z.string().datetime({ offset: true }),
  createdBy: z.string().min(1),
  approvedBy: z.string().min(1).optional(),
  approvedAt: z.string().datetime({ offset: true }).optional(),
  returnReason: z.string().min(1).optional(),
  deliveryResult: ManualNotificationDeliveryResultSchema.optional(),
}).openapi({
  title: 'ManualNotificationDetail',
  description: 'Manual notification detail projection for I-03',
});

export const GetManualNotificationDetailResponseSchema = z.object({
  item: ManualNotificationDetailSchema,
});

const commaSeparated = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess((value) => {
    const values = Array.isArray(value) ? value : [value];
    return values
      .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
      .map((item) => item.trim())
      .filter(Boolean);
  }, z.array(schema).optional());

const booleanQuery = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false' || value === undefined) return false;
  return value;
}, z.boolean().default(false));

export const GetManualNotificationsQuerySchema = z
  .object({
    includeTotalAll: booleanQuery,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort: z.enum(['id', 'title', 'status', 'updatedAt']).default('updatedAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
    status: commaSeparated(ManualNotificationStatusSchema),
    channel: commaSeparated(ManualNotificationChannelSchema),
    targetType: commaSeparated(ManualNotificationTargetTypeSchema),
    q: z.string().trim().max(100).optional(),
  })
  .openapi({
    title: 'GetManualNotificationsQuery',
    description: 'Manual notification list query for I-03',
  });

export const ManualNotificationPaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  totalAllItems: z.number().int().nonnegative().optional(),
});

export const GetManualNotificationsResponseSchema = z.object({
  items: z.array(ManualNotificationListItemSchema),
  pagination: ManualNotificationPaginationSchema,
});

export const ManualNotificationErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  userMessage: z.string(),
  traceId: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const ManualNotificationActionSchema = z.object({
  action: z.enum(['request_approval', 'send', 'approve', 'return', 'resubmit', 'delete']),
  reason: z.string().trim().min(1).max(500).optional(),
});

export const ManualNotificationActionResponseSchema = z.object({
  item: ManualNotificationListItemSchema,
});

export type ManualNotificationStatus = z.infer<typeof ManualNotificationStatusSchema>;
export type ManualNotificationChannel = z.infer<typeof ManualNotificationChannelSchema>;
export type ManualNotificationBrand = z.infer<typeof ManualNotificationBrandSchema>;
export type ManualNotificationTargetType = z.infer<typeof ManualNotificationTargetTypeSchema>;
export type ManualNotificationTarget = z.infer<typeof ManualNotificationTargetSchema>;
export type ManualNotificationTiming = z.infer<typeof ManualNotificationTimingSchema>;
export type ManualNotificationListItem = z.infer<typeof ManualNotificationListItemSchema>;
export type ManualNotificationDetail = z.infer<typeof ManualNotificationDetailSchema>;
export type GetManualNotificationDetailResponse = z.infer<
  typeof GetManualNotificationDetailResponseSchema
>;
export type GetManualNotificationsQuery = z.infer<typeof GetManualNotificationsQuerySchema>;
export type GetManualNotificationsResponse = z.infer<typeof GetManualNotificationsResponseSchema>;
export type ManualNotificationErrorResponse = z.infer<typeof ManualNotificationErrorResponseSchema>;
export type ManualNotificationAction = z.infer<typeof ManualNotificationActionSchema>;
