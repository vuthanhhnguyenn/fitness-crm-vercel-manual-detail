import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const LockerShapeSchema = z.enum(['3x9', '3x6', '2x10', '2x4']).openapi({
  title: 'LockerShape',
  description: 'Locker shape / arrangement pattern',
});

export const LockerNumberingPatternSchema = z
  .enum(['top_left_to_right', 'bottom_left_to_right', 'top_left_to_bottom', 'top_right_to_left'])
  .openapi({
    title: 'LockerNumberingPattern',
    description: 'Slot numbering direction pattern',
  });

export const LockerOptionTypeSchema = z.enum(['none', 'standard', 'premium']).openapi({
  title: 'LockerOptionType',
  description: 'Locker option contract type',
});

export const LockerContractStatusSchema = z
  .enum(['in_use', 'pending_release', 'available'])
  .openapi({
    title: 'LockerContractStatus',
    description: 'Locker contract status',
  });

export const LockerPendingLocationSchema = z
  .enum(['a_changing_room', 'b_gym_area', 'c_pool_side', 'f_entrance'])
  .openapi({
    title: 'LockerPendingLocation',
    description: 'Pending slot locker location',
  });

export const LockerLockTypeSchema = z.enum(['dial', 'cylinder']).openapi({
  title: 'LockerLockType',
  description: 'Locker lock type',
});

export const LockerSlotStatusSchema = z.enum(['available', 'in_use', 'pending_release']).openapi({
  title: 'LockerSlotStatus',
  description: 'Locker slot status',
});

export const LockerSlotOpenTypeSchema = z.enum(['door', 'drawer']).openapi({
  title: 'LockerSlotOpenType',
  description: 'Locker slot open type',
});

export const LockerReminderNotificationStatusSchema = z.enum(['unsent', 'sent', 'failed']).openapi({
  title: 'LockerReminderNotificationStatus',
  description: 'Reminder notification delivery status',
});

export const LockerReminderNotificationMethodSchema = z.enum(['push', 'in_app']).openapi({
  title: 'LockerReminderNotificationMethod',
  description: 'Reminder notification delivery method',
});

export const LockerSortFieldSchema = z
  .enum(['locker_id', 'area', 'shape', 'option_type', 'slots', 'available_slots', 'in_use_slots'])
  .openapi({
    title: 'LockerSortField',
    description: 'Sort field for locker list',
  });

export const LockerContractSortFieldSchema = z
  .enum([
    'contract_id',
    'member_name',
    'locker_number',
    'contract_type',
    'start_date',
    'end_date',
    'status',
  ])
  .openapi({
    title: 'LockerContractSortField',
    description: 'Sort field for locker contract list',
  });

export const LockerPendingSortFieldSchema = z
  .enum([
    'slot_number',
    'locker_location',
    'member_name',
    'cancel_date',
    'pending_since',
    'pending_days',
  ])
  .openapi({
    title: 'LockerPendingSortField',
    description: 'Sort field for pending locker slot list',
  });

export const LockerListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'locker-001', description: 'Internal locker row id' }),
    locker_id: z.string().openapi({ example: 'LK-001', description: 'Locker display id' }),
    store_id: z.string().openapi({ example: 'store-006', description: 'Store internal id' }),
    store_name: z.string().openapi({ example: 'JOYFIT24 新宿店', description: 'Store name' }),
    area: z.string().openapi({ example: '1F 男性更衣室', description: 'Locker area' }),
    shape: LockerShapeSchema.openapi({ description: 'Locker shape' }),
    option_type: LockerOptionTypeSchema.openapi({ description: 'Option contract type' }),
    slots: z.number().int().openapi({ example: 27, description: 'Total slots' }),
    available_slots: z.number().int().openapi({ example: 18, description: 'Available slots' }),
    in_use_slots: z.number().int().openapi({ example: 9, description: 'In-use slots' }),
    numbering_pattern: z.string().openapi({
      example: 'A-001〜A-027',
      description: 'Locker numbering pattern',
    }),
  })
  .openapi({
    title: 'LockerListItem',
    description: 'Locker list row',
  });

export const LockerContractListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'locker-contract-001', description: 'Internal row id' }),
    contract_id: z.string().openapi({ example: 'CNT-001', description: 'Contract display id' }),
    locker_id: z.string().openapi({ example: 'locker-001', description: 'Locker internal id' }),
    store_id: z.string().openapi({ example: 'store-006', description: 'Store internal id' }),
    store_name: z.string().openapi({ example: 'JOYFIT24 新宿店', description: 'Store name' }),
    member_name: z.string().openapi({ example: '田中 太郎', description: 'Member name' }),
    member_id: z.string().openapi({ example: 'MBR-00245', description: 'Member id' }),
    locker_number: z.string().openapi({ example: 'A-012', description: 'Locker slot number' }),
    contract_type: LockerOptionTypeSchema.openapi({ description: 'Contract type' }),
    start_date: z.string().openapi({
      example: '2025-04-01T00:00:00Z',
      description: 'Contract start date-time (ISO 8601 UTC)',
    }),
    end_date: z.string().openapi({
      example: '2026-03-31T00:00:00Z',
      description: 'Contract end date-time (ISO 8601 UTC)',
    }),
    status: LockerContractStatusSchema.openapi({ description: 'Contract status' }),
  })
  .openapi({
    title: 'LockerContractListItem',
    description: 'Locker contract list row',
  });

export const LockerPendingSlotListItemSchema = z
  .object({
    id: z.string().openapi({ example: 'pending-slot-001', description: 'Internal row id' }),
    locker_id: z.string().openapi({ example: 'locker-001', description: 'Locker internal id' }),
    store_id: z.string().openapi({ example: 'store-006', description: 'Store internal id' }),
    store_name: z.string().openapi({ example: 'JOYFIT24 新宿店', description: 'Store name' }),
    locker_location: LockerPendingLocationSchema.openapi({ description: 'Locker location' }),
    locker_name: z.string().openapi({ example: 'ロッカーA', description: 'Locker name' }),
    slot_number: z.string().openapi({ example: 'A-003', description: 'Slot number' }),
    member_name: z.string().openapi({ example: '鈴木 花子', description: 'Member name' }),
    member_id: z.string().openapi({ example: 'MBR-00234', description: 'Member id' }),
    cancel_date: z.string().openapi({ example: '2026/03/15', description: 'Cancel date' }),
    pending_since: z.string().openapi({ example: '2026/03/16', description: 'Pending since' }),
    pending_days: z.number().int().openapi({ example: 31, description: 'Pending days' }),
    size: z.string().openapi({ example: 'W35×H40×D50', description: 'Locker slot size' }),
    lock_type: LockerLockTypeSchema.openapi({ description: 'Lock type' }),
  })
  .openapi({
    title: 'LockerPendingSlotListItem',
    description: 'Pending locker slot list row',
  });

export const LockerPaginationSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 30 }),
    total: z.number().int().openapi({ example: 8 }),
    total_pages: z.number().int().openapi({ example: 1 }),
  })
  .openapi({
    title: 'LockerPagination',
    description: 'Pagination metadata for locker list endpoints',
  });

export const GetLockersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().min(1).max(100).default(30).openapi({ example: 30 }),
    search: z.string().optional().openapi({ description: 'Search by locker id or area' }),
    shape: LockerShapeSchema.optional().openapi({ description: 'Locker shape filter' }),
    sort_by: LockerSortFieldSchema.default('locker_id').openapi({ description: 'Sort field' }),
    sort_order: z.enum(['asc', 'desc']).default('asc').openapi({ description: 'Sort order' }),
  })
  .openapi({
    title: 'GetLockersQuery',
    description: 'Query parameters for locker list',
  });

export const GetLockerContractsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().min(1).max(100).default(30).openapi({ example: 30 }),
    search: z.string().optional().openapi({ description: 'Search by contract id or member name' }),
    contract_type: LockerOptionTypeSchema.optional().openapi({
      description: 'Contract type filter',
    }),
    status: LockerContractStatusSchema.optional().openapi({
      description: 'Contract status filter',
    }),
    sort_by: LockerContractSortFieldSchema.default('contract_id').openapi({
      description: 'Sort field',
    }),
    sort_order: z.enum(['asc', 'desc']).default('asc').openapi({ description: 'Sort order' }),
  })
  .openapi({
    title: 'GetLockerContractsQuery',
    description: 'Query parameters for locker contract list',
  });

export const GetLockerPendingSlotsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().min(1).max(100).default(30).openapi({ example: 30 }),
    search: z.string().optional().openapi({ description: 'Search by slot number or member name' }),
    store_id: z.string().optional().openapi({ description: 'Store filter' }),
    locker_location: LockerPendingLocationSchema.optional().openapi({
      description: 'Location filter',
    }),
    cancel_date_from: z
      .string()
      .optional()
      .openapi({ description: 'Cancel date from (YYYY/MM/DD)' }),
    cancel_date_to: z.string().optional().openapi({ description: 'Cancel date to (YYYY/MM/DD)' }),
    sort_by: LockerPendingSortFieldSchema.default('pending_since').openapi({
      description: 'Sort field',
    }),
    sort_order: z.enum(['asc', 'desc']).default('asc').openapi({ description: 'Sort order' }),
  })
  .openapi({
    title: 'GetLockerPendingSlotsQuery',
    description: 'Query parameters for pending locker slot list',
  });

export const ExportLockersQuerySchema = GetLockersQuerySchema.omit({
  page: true,
  limit: true,
}).openapi({
  title: 'ExportLockersQuery',
  description: 'Query parameters for locker list export (filters and sort only)',
});

export const ExportLockerContractsQuerySchema = GetLockerContractsQuerySchema.omit({
  page: true,
  limit: true,
}).openapi({
  title: 'ExportLockerContractsQuery',
  description: 'Query parameters for locker contract list export (filters and sort only)',
});

export const ExportLockerPendingSlotsQuerySchema = GetLockerPendingSlotsQuerySchema.omit({
  page: true,
  limit: true,
}).openapi({
  title: 'ExportLockerPendingSlotsQuery',
  description: 'Query parameters for pending locker slot list export (filters and sort only)',
});

export const ExportLockerSlotsQuerySchema = z
  .object({
    pending_only: z
      .string()
      .optional()
      .openapi({ description: 'When "true", export pending-release slots only' }),
  })
  .transform((query) => ({
    pending_only: query.pending_only === 'true',
  }))
  .openapi({
    title: 'ExportLockerSlotsQuery',
    description: 'Query parameters for locker slot export on locker detail screen',
  });

export const ExportLockersRequestSchema = GetLockersQuerySchema.omit({
  page: true,
  limit: true,
}).openapi({
  title: 'ExportLockersRequest',
  description: 'Request body for locker list export (filters and sort only)',
});

export const ExportLockerContractsRequestSchema = GetLockerContractsQuerySchema.omit({
  page: true,
  limit: true,
}).openapi({
  title: 'ExportLockerContractsRequest',
  description: 'Request body for locker contract list export (filters and sort only)',
});

export const ExportLockerPendingSlotsRequestSchema = GetLockerPendingSlotsQuerySchema.omit({
  page: true,
  limit: true,
}).openapi({
  title: 'ExportLockerPendingSlotsRequest',
  description: 'Request body for pending locker slot list export (filters and sort only)',
});

export const ExportLockerSlotsRequestSchema = z
  .object({
    pending_only: z
      .boolean()
      .optional()
      .openapi({ description: 'When true, export pending-release slots only' }),
  })
  .openapi({
    title: 'ExportLockerSlotsRequest',
    description: 'Request body for locker slot export on locker detail screen',
  });

export const ExportLockersResponseSchema = z
  .object({
    lockers: z.array(LockerListItemSchema).openapi({ description: 'Filtered locker rows' }),
  })
  .openapi({
    title: 'ExportLockersResponse',
    description: 'Locker list export data without pagination',
  });

export const ExportLockerContractsResponseSchema = z
  .object({
    contracts: z
      .array(LockerContractListItemSchema)
      .openapi({ description: 'Filtered locker contract rows' }),
  })
  .openapi({
    title: 'ExportLockerContractsResponse',
    description: 'Locker contract list export data without pagination',
  });

export const ExportLockerPendingSlotsResponseSchema = z
  .object({
    pending_slots: z
      .array(LockerPendingSlotListItemSchema)
      .openapi({ description: 'Filtered pending slot rows' }),
  })
  .openapi({
    title: 'ExportLockerPendingSlotsResponse',
    description: 'Pending locker slot list export data without pagination',
  });

export const GetLockersResponseSchema = z
  .object({
    lockers: z.array(LockerListItemSchema).openapi({ description: 'Locker rows' }),
    pagination: LockerPaginationSchema,
  })
  .openapi({
    title: 'GetLockersResponse',
    description: 'Locker list response',
  });

export const GetLockerContractsResponseSchema = z
  .object({
    contracts: z
      .array(LockerContractListItemSchema)
      .openapi({ description: 'Locker contract rows' }),
    pagination: LockerPaginationSchema,
  })
  .openapi({
    title: 'GetLockerContractsResponse',
    description: 'Locker contract list response',
  });

export const LockerContractDetailSchema = LockerContractListItemSchema.extend({
  locker_display_id: z.string().openapi({ example: 'LK-001', description: 'Locker display id' }),
  locker_area: z.string().openapi({ example: '1F 男性更衣室', description: 'Locker area' }),
  contract_type_code: z
    .string()
    .nullable()
    .openapi({ example: 'LK-STD-001', description: 'G-02 contract type code' }),
  option_contract_name: z
    .string()
    .openapi({ example: 'プレミアムロッカー', description: 'Option contract name' }),
  slot_size: z
    .string()
    .openapi({ example: 'L（W35 × D48 × H40 cm）', description: 'Slot size label' }),
  member_phone: z.string().openapi({ example: '090-1234-5678', description: 'Member phone' }),
  member_email: z.string().openapi({ example: 'tanaka@example.com', description: 'Member email' }),
  termination_date: z.string().nullable().openapi({
    example: '2026-03-31T00:00:00Z',
    description: 'Contract termination date-time (ISO 8601 UTC)',
  }),
  password: z.string().nullable().openapi({ example: '3847', description: 'Dial password' }),
  password_updated_at: z.string().nullable().openapi({
    example: '2025-04-01T00:00:00Z',
    description: 'Password last updated at (ISO 8601 UTC)',
  }),
  created_at: z.string().openapi({ example: '2025/03/15 10:00', description: 'Created at' }),
  updated_at: z.string().openapi({ example: '2026/03/01 09:00', description: 'Updated at' }),
}).openapi({
  title: 'LockerContractDetail',
  description: 'Locker contract detail',
});

export const GetLockerContractDetailResponseSchema = z
  .object({
    contract: LockerContractDetailSchema,
  })
  .openapi({
    title: 'GetLockerContractDetailResponse',
    description: 'Locker contract detail response',
  });

export const CreateLockerContractRequestSchema = z
  .object({
    member_id: z.string().min(1).openapi({ example: 'M-00042', description: 'Member id' }),
    locker_id: z
      .string()
      .min(1)
      .openapi({ example: 'locker-001', description: 'Locker internal id' }),
    slot_number: z.string().min(1).openapi({ example: 'A-013', description: 'Slot number' }),
    contract_type_code: z
      .string()
      .min(1)
      .openapi({ example: 'LK-STD-001', description: 'G-02 contract type code' }),
    start_date: z.string().min(1).openapi({
      example: '2025-04-01T00:00:00Z',
      description: 'Contract start date-time (ISO 8601 UTC)',
    }),
    password: z
      .string()
      .regex(/^\d{4}$/)
      .nullable()
      .optional()
      .openapi({ example: '3847', description: 'Dial password (4 digits)' }),
  })
  .openapi({
    title: 'CreateLockerContractRequest',
    description: 'Request to create a locker contract',
  });

export const UpdateLockerContractRequestSchema = z
  .object({
    locker_id: z.string().min(1).optional().openapi({ description: 'Locker internal id' }),
    slot_number: z.string().min(1).optional().openapi({ description: 'Slot number' }),
    contract_type_code: z
      .string()
      .min(1)
      .optional()
      .openapi({ description: 'G-02 contract type code' }),
    start_date: z
      .string()
      .min(1)
      .optional()
      .openapi({ description: 'Contract start date-time (ISO 8601 UTC)' }),
    password: z
      .string()
      .regex(/^\d{4}$/)
      .nullable()
      .optional()
      .openapi({ description: 'Dial password (4 digits)' }),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  })
  .openapi({
    title: 'UpdateLockerContractRequest',
    description: 'Request to update a locker contract',
  });

export const CreateLockerContractResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ロッカー契約を登録しました' }),
    contract: LockerContractDetailSchema,
  })
  .openapi({
    title: 'CreateLockerContractResponse',
    description: 'Locker contract create response',
  });

export const UpdateLockerContractResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ロッカー契約を更新しました' }),
    contract: LockerContractDetailSchema,
  })
  .openapi({
    title: 'UpdateLockerContractResponse',
    description: 'Locker contract update response',
  });

export const CancelLockerContractRequestSchema = z
  .object({
    termination_date: z.string().openapi({
      example: '2026-03-31T00:00:00Z',
      description: 'Termination date-time (ISO 8601 UTC)',
    }),
  })
  .superRefine((data, ctx) => {
    const terminationDate = parseISO(data.termination_date);
    if (Number.isNaN(terminationDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['termination_date'],
        message: '解約日の形式が正しくありません',
      });
      return;
    }

    if (isBefore(startOfDay(terminationDate), startOfDay(new Date()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['termination_date'],
        message: '解約日は本日以降の日付を指定してください',
      });
    }
  })
  .openapi({
    title: 'CancelLockerContractRequest',
    description: 'Payload to cancel a locker contract',
  });

export const CancelLockerContractResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ロッカー契約を解約しました' }),
    contract_id: z.string().openapi({ example: 'locker-contract-001' }),
    termination_date: z.string().openapi({ example: '2026-03-31T00:00:00Z' }),
  })
  .openapi({
    title: 'CancelLockerContractResponse',
    description: 'Locker contract cancel response',
  });

export const LockerContractChangeHistoryItemSchema = z
  .object({
    date: z.string().openapi({ example: '2026/03/01 10:00' }),
    user: z.string().openapi({ example: 'テストユーザー' }),
    field: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string(),
  })
  .openapi({
    title: 'LockerContractChangeHistoryItem',
    description: 'Locker contract change history item',
  });

export const GetLockerContractChangeHistoryResponseSchema = z
  .object({
    history: z.array(LockerContractChangeHistoryItemSchema),
  })
  .openapi({
    title: 'GetLockerContractChangeHistoryResponse',
    description: 'Locker contract change history response',
  });

export const GetLockerPendingSlotsResponseSchema = z
  .object({
    pending_slots: z
      .array(LockerPendingSlotListItemSchema)
      .openapi({ description: 'Pending slot rows' }),
    pagination: LockerPaginationSchema,
  })
  .openapi({
    title: 'GetLockerPendingSlotsResponse',
    description: 'Pending locker slot list response',
  });

export const GetLockerSummaryResponseSchema = z
  .object({
    lockers_count: z.number().int().openapi({ example: 4, description: 'Locker row count' }),
    contracts_count: z
      .number()
      .int()
      .openapi({ example: 6, description: 'Locker contract row count' }),
    pending_slots_count: z
      .number()
      .int()
      .openapi({ example: 6, description: 'Pending slot row count' }),
  })
  .openapi({
    title: 'GetLockerSummaryResponse',
    description: 'Summary counters for the locker tabs',
  });

export const LockerOptionMasterRefSchema = z
  .object({
    id: z.string().openapi({ example: 'OP036', description: 'Option master id' }),
    name: z.string().openapi({ example: 'プレミアムロッカー', description: 'Option master name' }),
    code: z.string().openapi({ example: 'LK-3x9-PREMIUM-001', description: 'Option master code' }),
    price_including_tax: z
      .number()
      .int()
      .openapi({ example: 1650, description: 'Monthly price including tax' }),
  })
  .openapi({
    title: 'LockerOptionMasterRef',
    description: 'Lightweight locker-related option master reference',
  });

export const LockerContractTypeMasterSchema = LockerOptionMasterRefSchema.extend({
  description: z.string().nullable().openapi({ example: '大型・特別設置スロット向け' }),
}).openapi({
  title: 'LockerContractTypeMaster',
  description: 'Locker contract type master used in slot assignment',
});

export const LockerReminderNotificationSchema = z
  .object({
    id: z.string().openapi({ example: 'notify-001', description: 'Notification id' }),
    sent_at: z.string().openapi({ example: '2026/04/10 10:00', description: 'Sent timestamp' }),
    method: LockerReminderNotificationMethodSchema.openapi({ description: 'Delivery method' }),
    status: LockerReminderNotificationStatusSchema.openapi({ description: 'Delivery status' }),
  })
  .openapi({
    title: 'LockerReminderNotification',
    description: 'Reminder notification history item for a pending-release slot',
  });

export const LockerSlotItemSchema = z
  .object({
    id: z.string().openapi({ example: 'slot-locker-001-A-001', description: 'Slot row id' }),
    locker_id: z.string().openapi({ example: 'locker-001', description: 'Locker internal id' }),
    slot_number: z.string().openapi({ example: 'A-001', description: 'Slot number' }),
    row_number: z.number().int().openapi({ example: 1, description: 'Visual row number' }),
    column_number: z.number().int().openapi({ example: 1, description: 'Visual column number' }),
    is_bottom_row: z
      .boolean()
      .openapi({ example: true, description: 'Whether the slot is in the bottom row' }),
    status: LockerSlotStatusSchema.openapi({ description: 'Slot status' }),
    lock_type: LockerLockTypeSchema.openapi({ description: 'Lock type' }),
    open_type: LockerSlotOpenTypeSchema.openapi({ description: 'Open type' }),
    width_cm: z.number().int().openapi({ example: 35, description: 'Slot width in cm' }),
    height_cm: z.number().int().openapi({ example: 40, description: 'Slot height in cm' }),
    depth_cm: z.number().int().openapi({ example: 50, description: 'Slot depth in cm' }),
    password: z.string().nullable().openapi({ example: '3847', description: 'Dial password' }),
    member_name: z
      .string()
      .nullable()
      .openapi({ example: '田中 花子', description: 'Assigned member name' }),
    member_id: z
      .string()
      .nullable()
      .openapi({ example: 'M-0042', description: 'Assigned member id' }),
    cancel_date: z
      .string()
      .nullable()
      .openapi({ example: '2026/04/30', description: 'Scheduled cancel date' }),
    contract_start_date: z
      .string()
      .nullable()
      .openapi({ example: '2025/06/01', description: 'Contract start date' }),
    option_contract_name: z
      .string()
      .nullable()
      .openapi({ example: 'プレミアムロッカー', description: 'Assigned option contract name' }),
    contract_id: z
      .string()
      .nullable()
      .openapi({ example: 'CNT-001', description: 'Locker contract id' }),
    contract_type_code: z
      .string()
      .nullable()
      .openapi({ example: 'LK-DSC-001', description: 'Assigned contract type code' }),
    individual_fee: z
      .number()
      .int()
      .nullable()
      .openapi({ example: 880, description: 'Individual fee for bottom-row slot' }),
    fee_applied_at: z
      .string()
      .nullable()
      .openapi({ example: '2026/02/01', description: 'Individual fee applied date' }),
    reminder_notifications: z
      .array(LockerReminderNotificationSchema)
      .openapi({ description: 'Reminder notification history' }),
  })
  .openapi({
    title: 'LockerSlotItem',
    description: 'Detailed locker slot item used by the locker detail screen',
  });

export const ExportLockerSlotsResponseSchema = z
  .object({
    slots: z.array(LockerSlotItemSchema).openapi({ description: 'Filtered locker slot rows' }),
  })
  .openapi({
    title: 'ExportLockerSlotsResponse',
    description: 'Locker slot list export data for locker detail screen',
  });

export const LockerSlotSummarySchema = z
  .object({
    total_slots: z.number().int().openapi({ example: 27, description: 'Total slots' }),
    available_slots: z.number().int().openapi({ example: 17, description: 'Available slots' }),
    in_use_slots: z.number().int().openapi({ example: 8, description: 'In-use slots' }),
    pending_release_slots: z
      .number()
      .int()
      .openapi({ example: 2, description: 'Pending-release slots' }),
    utilization_rate_percent: z
      .number()
      .openapi({ example: 37, description: 'Utilization rate percentage' }),
  })
  .openapi({
    title: 'LockerSlotSummary',
    description: 'Locker slot usage summary',
  });

export const LockerSlotLockSettingSchema = z
  .object({
    slot_number: z.string().openapi({ example: 'A-001', description: 'Slot number' }),
    lock_type: LockerLockTypeSchema.openapi({ description: 'Lock type override' }),
    password: z
      .string()
      .regex(/^\d{4}$/)
      .nullable()
      .optional()
      .openapi({ example: '3847', description: 'Dial password override' }),
  })
  .openapi({
    title: 'LockerSlotLockSetting',
    description: 'Per-slot lock type and password override',
  });

export const LockerDetailSchema = z
  .object({
    id: z.string().openapi({ example: 'locker-001', description: 'Internal locker row id' }),
    locker_id: z.string().openapi({ example: 'LK-001', description: 'Locker display id' }),
    store_id: z.string().openapi({ example: 'store-006', description: 'Store internal id' }),
    store_name: z.string().openapi({ example: 'JOYFIT24 新宿店', description: 'Store name' }),
    area: z.string().openapi({ example: '1F 男性更衣室', description: 'Locker area' }),
    location_symbol: z.string().openapi({ example: 'A', description: 'Location symbol prefix' }),
    shape: LockerShapeSchema.openapi({ description: 'Locker shape' }),
    slot_numbering_pattern: LockerNumberingPatternSchema.openapi({
      description: 'Slot numbering direction pattern',
    }),
    start_number: z
      .number()
      .int()
      .openapi({ example: 1, description: 'Slot numbering start value' }),
    default_open_type: LockerSlotOpenTypeSchema.openapi({
      description: 'Default open type for slots',
    }),
    default_lock_type: LockerLockTypeSchema.openapi({
      description: 'Default lock type for slots',
    }),
    slot_lock_settings: z
      .array(LockerSlotLockSettingSchema)
      .openapi({ description: 'Per-slot lock overrides' }),
    option_type: LockerOptionTypeSchema.openapi({ description: 'Option contract type' }),
    slots: z.number().int().openapi({ example: 27, description: 'Total slots' }),
    available_slots: z.number().int().openapi({ example: 18, description: 'Available slots' }),
    in_use_slots: z.number().int().openapi({ example: 9, description: 'In-use slots' }),
    numbering_pattern: z.string().openapi({
      example: 'A-001〜A-027',
      description: 'Locker numbering pattern',
    }),
    has_active_slots: z.boolean().openapi({
      example: true,
      description: 'Whether the locker has in-use or pending-release slots',
    }),
    option_contract_master: LockerOptionMasterRefSchema.nullable().openapi({
      description: 'Assigned option contract master',
    }),
    contract_type_code: z
      .string()
      .nullable()
      .openapi({ example: 'LK-3x9-PREMIUM-001', description: 'Locker contract type code' }),
    guide_text: z.string().nullable().openapi({
      example: '更衣室入口から右手奥、男性専用エリアの隣',
      description: 'Guide text for staff',
    }),
    note: z.string().nullable().openapi({
      example: '1F男性更衣室入口付近に設置。プレミアムロッカーとして契約可能。',
      description: 'Additional note',
    }),
    image_url: z.string().nullable().openapi({
      description: 'Locker image URL',
    }),
    created_at: z.string().openapi({ example: '2025/01/15 10:00', description: 'Created at' }),
    updated_at: z.string().openapi({ example: '2026/03/10 09:00', description: 'Updated at' }),
    summary: LockerSlotSummarySchema.openapi({ description: 'Slot summary' }),
    slot_items: z.array(LockerSlotItemSchema).openapi({ description: 'Detailed slots' }),
    contracts: z
      .array(LockerContractListItemSchema)
      .openapi({ description: 'Associated contracts' }),
    pending_slots: z
      .array(LockerPendingSlotListItemSchema)
      .openapi({ description: 'Pending slots' }),
  })
  .openapi({
    title: 'LockerDetail',
    description: 'Locker detail with associated contracts and pending slots',
  });

export const GetLockerDetailResponseSchema = z
  .object({
    locker: LockerDetailSchema,
  })
  .openapi({
    title: 'GetLockerDetailResponse',
    description: 'Locker detail response',
  });

export const GetLockerHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce.number().int().min(1).max(100).default(30).openapi({ example: 30 }),
    sort_by: z
      .enum(['date', 'user', 'action', 'detail'])
      .default('date')
      .openapi({ description: 'Sort field' }),
    sort_order: z.enum(['asc', 'desc']).default('desc').openapi({ description: 'Sort order' }),
  })
  .openapi({
    title: 'GetLockerHistoryQuery',
    description: 'Query parameters for locker change history',
  });

export const LockerHistoryItemSchema = z
  .object({
    id: z.string().openapi({ example: 'hist-001', description: 'History item id' }),
    date: z.string().openapi({ example: '2026/03/10 09:00', description: 'Date of change' }),
    user: z.string().openapi({ example: '山田 太郎', description: 'User who made the change' }),
    action: z.string().openapi({ example: 'スロット状態変更', description: 'Action type' }),
    detail: z
      .string()
      .openapi({ example: 'A-007 開放待ち → 利用可能', description: 'Change detail' }),
  })
  .openapi({
    title: 'LockerHistoryItem',
    description: 'Locker change history item',
  });

export const LockerHistoryPaginationSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 30 }),
    total: z.number().int().openapi({ example: 10 }),
    total_pages: z.number().int().openapi({ example: 1 }),
  })
  .openapi({
    title: 'LockerHistoryPagination',
    description: 'Pagination metadata for locker history',
  });

export const GetLockerHistoryResponseSchema = z
  .object({
    history: z.array(LockerHistoryItemSchema).openapi({ description: 'History items' }),
    pagination: LockerHistoryPaginationSchema,
  })
  .openapi({
    title: 'GetLockerHistoryResponse',
    description: 'Locker change history response',
  });

export const DeleteLockerResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ロッカーを削除しました' }),
  })
  .openapi({
    title: 'DeleteLockerResponse',
    description: 'Locker delete response',
  });

export const CreateLockerRequestSchema = z
  .object({
    store_id: z.string().min(1).openapi({ example: 'store-006', description: 'Store internal id' }),
    location_symbol: z
      .string()
      .min(1)
      .max(2)
      .openapi({ example: 'A', description: 'Location symbol (slot prefix)' }),
    area_label: z
      .string()
      .optional()
      .openapi({ example: 'A: 更衣室エリア', description: 'Display area label' }),
    guide_text: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: 'Member-facing guide text' }),
    note: z.string().nullable().optional().openapi({ description: 'Staff-only note' }),
    image_url: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: 'Locker image (base64 or URL)' }),
    shape: LockerShapeSchema.openapi({ description: 'Locker shape' }),
    slot_numbering_pattern: LockerNumberingPatternSchema.openapi({
      description: 'Slot numbering direction pattern',
    }),
    start_number: z
      .number()
      .int()
      .min(1)
      .default(1)
      .openapi({ example: 1, description: 'Slot numbering start value' }),
    option_type: LockerOptionTypeSchema.openapi({ description: 'Option contract type' }),
    contract_type_code: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'LK-3x9-PREMIUM-001', description: 'G-02 contract type code' }),
    default_open_type: LockerSlotOpenTypeSchema.openapi({
      description: 'Default open type for slots',
    }),
    default_lock_type: LockerLockTypeSchema.openapi({
      description: 'Default lock type for slots',
    }),
    slot_lock_settings: z
      .array(LockerSlotLockSettingSchema)
      .optional()
      .openapi({ description: 'Per-slot lock overrides' }),
  })
  .openapi({
    title: 'CreateLockerRequest',
    description: 'Request to create a new locker',
  });

export const UpdateLockerRequestSchema = CreateLockerRequestSchema.omit({
  shape: true,
  store_id: true,
})
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  })
  .openapi({
    title: 'UpdateLockerRequest',
    description: 'Request to update locker settings (shape cannot be changed)',
  });

export const CreateLockerResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ロッカーを登録しました' }),
    locker: LockerDetailSchema,
  })
  .openapi({
    title: 'CreateLockerResponse',
    description: 'Locker create response',
  });

export const UpdateLockerResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'ロッカー情報を更新しました' }),
    locker: LockerDetailSchema,
  })
  .openapi({
    title: 'UpdateLockerResponse',
    description: 'Locker update response',
  });

export const GetLockerUsedLocationSymbolsQuerySchema = z
  .object({
    store_id: z.string().min(1).openapi({ example: 'store-006', description: 'Store internal id' }),
    exclude_locker_id: z
      .string()
      .optional()
      .openapi({ description: 'Locker id to exclude (for edit mode)' }),
  })
  .openapi({
    title: 'GetLockerUsedLocationSymbolsQuery',
    description: 'Query parameters for used location symbols',
  });

export const GetLockerUsedLocationSymbolsResponseSchema = z
  .object({
    location_symbols: z
      .array(z.string())
      .openapi({ example: ['A', 'B'], description: 'Used location symbols in the store' }),
  })
  .openapi({
    title: 'GetLockerUsedLocationSymbolsResponse',
    description: 'Used location symbols response',
  });

export const BulkReleaseLockerSlotsItemSchema = z
  .object({
    locker_id: z.string().openapi({ example: 'locker-001', description: 'Locker internal id' }),
    slot_numbers: z
      .array(z.string().min(1))
      .min(1)
      .openapi({ example: ['A-007', 'A-025'], description: 'Slot numbers to release' }),
  })
  .openapi({
    title: 'BulkReleaseLockerSlotsItem',
    description: 'Locker slot release target grouped by locker',
  });

export const BulkReleaseLockerSlotsRequestSchema = z
  .object({
    items: z
      .array(BulkReleaseLockerSlotsItemSchema)
      .min(1)
      .openapi({ description: 'Release targets grouped by locker' }),
  })
  .openapi({
    title: 'BulkReleaseLockerSlotsRequest',
    description: 'Request to release pending locker slots across one or more lockers',
  });

export const BulkReleaseLockerSlotsResponseSchema = z
  .object({
    message: z.string().openapi({ example: '3件のスロットを開放しました' }),
    released_slot_numbers: z
      .array(z.string())
      .openapi({ example: ['A-007', 'A-025', 'B-003'], description: 'Released slot numbers' }),
    locker_ids: z
      .array(z.string())
      .openapi({ example: ['locker-001', 'locker-002'], description: 'Affected locker ids' }),
  })
  .openapi({
    title: 'BulkReleaseLockerSlotsResponse',
    description: 'Bulk locker slot release response',
  });

export const UpdateLockerSlotRequestSchema = z
  .object({
    lock_type: LockerLockTypeSchema.optional().openapi({ description: 'Lock type' }),
    open_type: LockerSlotOpenTypeSchema.optional().openapi({ description: 'Open type' }),
    width_cm: z.number().int().positive().optional().openapi({ description: 'Slot width in cm' }),
    height_cm: z.number().int().positive().optional().openapi({ description: 'Slot height in cm' }),
    depth_cm: z.number().int().positive().optional().openapi({ description: 'Slot depth in cm' }),
    password: z
      .string()
      .regex(/^\d{4}$/)
      .nullable()
      .optional()
      .openapi({ example: '3847', description: 'Dial password (4 digits)' }),
    contract_type_code: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'LK-DSC-001', description: 'G-02 contract type code' }),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  })
  .openapi({
    title: 'UpdateLockerSlotRequest',
    description: 'Request to update locker slot settings',
  });

export const UpdateLockerSlotResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'スロット設定を更新しました' }),
    slot: LockerSlotItemSchema.openapi({ description: 'Updated slot' }),
    locker: LockerDetailSchema.openapi({ description: 'Updated locker detail' }),
  })
  .openapi({
    title: 'UpdateLockerSlotResponse',
    description: 'Locker slot update response',
  });

export const SendLockerSlotReminderRequestSchema = z
  .object({
    reminder_days: z
      .union([z.literal(7), z.literal(14), z.literal(30)])
      .default(7)
      .openapi({ example: 7, description: 'Days before cancel date to send reminder' }),
  })
  .openapi({
    title: 'SendLockerSlotReminderRequest',
    description: 'Request to send locker slot reminder notifications',
  });

export const SendLockerSlotReminderResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'リマインド通知を送信しました' }),
    notifications: z
      .array(LockerReminderNotificationSchema)
      .openapi({ description: 'Created notification records' }),
    slot: LockerSlotItemSchema.openapi({ description: 'Updated slot' }),
  })
  .openapi({
    title: 'SendLockerSlotReminderResponse',
    description: 'Locker slot reminder notification response',
  });

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: 'Bad request' }),
  })
  .openapi({
    title: 'LockerErrorResponse',
    description: 'Error response',
  });

export type LockerShape = z.infer<typeof LockerShapeSchema>;
export type LockerNumberingPattern = z.infer<typeof LockerNumberingPatternSchema>;
export type LockerSlotLockSetting = z.infer<typeof LockerSlotLockSettingSchema>;
export type LockerOptionType = z.infer<typeof LockerOptionTypeSchema>;
export type LockerContractStatus = z.infer<typeof LockerContractStatusSchema>;
export type LockerPendingLocation = z.infer<typeof LockerPendingLocationSchema>;
export type LockerLockType = z.infer<typeof LockerLockTypeSchema>;
export type LockerSlotStatus = z.infer<typeof LockerSlotStatusSchema>;
export type LockerSlotOpenType = z.infer<typeof LockerSlotOpenTypeSchema>;
export type LockerReminderNotificationStatus = z.infer<
  typeof LockerReminderNotificationStatusSchema
>;
export type LockerReminderNotificationMethod = z.infer<
  typeof LockerReminderNotificationMethodSchema
>;
export type LockerListItem = z.infer<typeof LockerListItemSchema>;
export type LockerContractListItem = z.infer<typeof LockerContractListItemSchema>;
export type LockerPendingSlotListItem = z.infer<typeof LockerPendingSlotListItemSchema>;
export type LockerOptionMasterRef = z.infer<typeof LockerOptionMasterRefSchema>;
export type LockerContractTypeMaster = z.infer<typeof LockerContractTypeMasterSchema>;
export type LockerReminderNotification = z.infer<typeof LockerReminderNotificationSchema>;
export type LockerSlotItem = z.infer<typeof LockerSlotItemSchema>;
export type LockerSlotSummary = z.infer<typeof LockerSlotSummarySchema>;
export type GetLockersQuery = z.infer<typeof GetLockersQuerySchema>;
export type GetLockerContractsQuery = z.infer<typeof GetLockerContractsQuerySchema>;
export type GetLockerPendingSlotsQuery = z.infer<typeof GetLockerPendingSlotsQuerySchema>;
export type ExportLockersQuery = z.infer<typeof ExportLockersQuerySchema>;
export type ExportLockerContractsQuery = z.infer<typeof ExportLockerContractsQuerySchema>;
export type ExportLockerPendingSlotsQuery = z.infer<typeof ExportLockerPendingSlotsQuerySchema>;
export type ExportLockerSlotsQuery = z.infer<typeof ExportLockerSlotsQuerySchema>;
export type ExportLockersRequest = z.infer<typeof ExportLockersRequestSchema>;
export type ExportLockerContractsRequest = z.infer<typeof ExportLockerContractsRequestSchema>;
export type ExportLockerPendingSlotsRequest = z.infer<typeof ExportLockerPendingSlotsRequestSchema>;
export type ExportLockerSlotsRequest = z.infer<typeof ExportLockerSlotsRequestSchema>;
export type ExportLockersResponse = z.infer<typeof ExportLockersResponseSchema>;
export type ExportLockerContractsResponse = z.infer<typeof ExportLockerContractsResponseSchema>;
export type ExportLockerPendingSlotsResponse = z.infer<
  typeof ExportLockerPendingSlotsResponseSchema
>;
export type ExportLockerSlotsResponse = z.infer<typeof ExportLockerSlotsResponseSchema>;
export type GetLockersResponse = z.infer<typeof GetLockersResponseSchema>;
export type GetLockerContractsResponse = z.infer<typeof GetLockerContractsResponseSchema>;
export type LockerContractDetail = z.infer<typeof LockerContractDetailSchema>;
export type GetLockerContractDetailResponse = z.infer<typeof GetLockerContractDetailResponseSchema>;
export type CreateLockerContractRequest = z.infer<typeof CreateLockerContractRequestSchema>;
export type UpdateLockerContractRequest = z.infer<typeof UpdateLockerContractRequestSchema>;
export type CreateLockerContractResponse = z.infer<typeof CreateLockerContractResponseSchema>;
export type UpdateLockerContractResponse = z.infer<typeof UpdateLockerContractResponseSchema>;
export type CancelLockerContractRequest = z.infer<typeof CancelLockerContractRequestSchema>;
export type CancelLockerContractResponse = z.infer<typeof CancelLockerContractResponseSchema>;
export type LockerContractChangeHistoryItem = z.infer<typeof LockerContractChangeHistoryItemSchema>;
export type GetLockerContractChangeHistoryResponse = z.infer<
  typeof GetLockerContractChangeHistoryResponseSchema
>;
export type GetLockerPendingSlotsResponse = z.infer<typeof GetLockerPendingSlotsResponseSchema>;
export type GetLockerSummaryResponse = z.infer<typeof GetLockerSummaryResponseSchema>;
export type LockerDetail = z.infer<typeof LockerDetailSchema>;
export type GetLockerDetailResponse = z.infer<typeof GetLockerDetailResponseSchema>;
export type GetLockerHistoryQuery = z.infer<typeof GetLockerHistoryQuerySchema>;
export type LockerHistoryItem = z.infer<typeof LockerHistoryItemSchema>;
export type LockerHistoryPagination = z.infer<typeof LockerHistoryPaginationSchema>;
export type GetLockerHistoryResponse = z.infer<typeof GetLockerHistoryResponseSchema>;
export type DeleteLockerResponse = z.infer<typeof DeleteLockerResponseSchema>;
export type CreateLockerRequest = z.infer<typeof CreateLockerRequestSchema>;
export type UpdateLockerRequest = z.infer<typeof UpdateLockerRequestSchema>;
export type CreateLockerResponse = z.infer<typeof CreateLockerResponseSchema>;
export type UpdateLockerResponse = z.infer<typeof UpdateLockerResponseSchema>;
export type GetLockerUsedLocationSymbolsQuery = z.infer<
  typeof GetLockerUsedLocationSymbolsQuerySchema
>;
export type GetLockerUsedLocationSymbolsResponse = z.infer<
  typeof GetLockerUsedLocationSymbolsResponseSchema
>;
export type BulkReleaseLockerSlotsRequest = z.infer<typeof BulkReleaseLockerSlotsRequestSchema>;
export type BulkReleaseLockerSlotsResponse = z.infer<typeof BulkReleaseLockerSlotsResponseSchema>;
export type UpdateLockerSlotRequest = z.infer<typeof UpdateLockerSlotRequestSchema>;
export type UpdateLockerSlotResponse = z.infer<typeof UpdateLockerSlotResponseSchema>;
export type SendLockerSlotReminderRequest = z.infer<typeof SendLockerSlotReminderRequestSchema>;
export type SendLockerSlotReminderResponse = z.infer<typeof SendLockerSlotReminderResponseSchema>;
