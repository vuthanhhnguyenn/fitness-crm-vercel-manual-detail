import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

export const GetMemberMainContractLabelsResponseSchema = z
  .object({
    labels: z.array(z.string()).openapi({
      description: 'Ordered main contract display names for the member form',
    }),
    default_label: z.string().openapi({
      example: 'レギュラー会員',
      description: 'Default selection when none is set',
    }),
  })
  .openapi({
    title: 'GetMemberMainContractLabelsResponse',
    description: 'Main contract label options for member create/edit (from mock DB)',
  });

export type GetMemberMainContractLabelsResponse = z.infer<
  typeof GetMemberMainContractLabelsResponseSchema
>;

/**
 * Member Type Schema
 */
export const MemberTypeSchema = z.enum(['regular', 'family', 'corporate', 'one_day_member']);
export const ContractTypeSchema = z.enum(['regular', 'one_day_member', 'family']);

/**
 * Member Status Schema
 */
export const MemberStatusSchema = z.enum([
  'active',
  'suspended',
  'gate_stop',
  'pending_withdrawal',
  'withdrawn',
  'force_withdrawn',
]);

/**
 * Brand Schema
 */
export const BrandSchema = z.enum(['joyfit', 'fit365', 'joyfit_plus', 'joyfit_yoga', 'joyfit24']);

/**
 * Main Brand Schema
 */
export const MainBrandSchema = z.enum(['joyfit', 'fit365']);

/**
 * Gender Schema
 */
export const GenderSchema = z.enum(['male', 'female', 'other']).openapi({
  title: 'Gender',
  description: 'Gender',
});

export const CampaignStatusSchema = z
  .enum(['active', 'expired', 'upcoming'])
  .openapi({ title: 'CampaignStatus', description: 'Campaign status' });

/**
 * Member List Item Schema (simplified for list view)
 */
export const MemberListItemSchema = z
  .object({
    id: z.string().openapi({
      example: 'M-00001',
      description: 'Member ID',
    }),
    old_member_number: z.string().openapi({
      example: 'O-M-00001',
      description: 'Old member number',
    }),
    member_number: z.string().openapi({
      example: 'M-00001',
      description: 'Member number',
    }),
    name_kanji: z.string().openapi({
      example: '佐藤 花子',
      description: 'Name in kanji',
    }),
    name_kana: z.string().openapi({
      example: 'サトウ ハナコ',
      description: 'Name in kana',
    }),
    member_type: MemberTypeSchema.openapi({
      example: 'regular',
      description: 'Member type',
    }),
    contract_type: ContractTypeSchema.openapi({
      example: 'regular',
      description: 'Contract type',
    }),
    status: MemberStatusSchema.openapi({
      example: 'active',
      description: 'Member status',
    }),
    store_name: z.string().openapi({
      example: 'Fit365八潮店',
      description: 'Store name',
    }),
    store_id: z.string().openapi({
      example: 'store-001',
      description: 'Store ID',
    }),
    brand: BrandSchema.openapi({
      example: 'fit365',
      description: 'Brand',
    }),
    contract_name: z.string().openapi({
      example: 'レギュラー会員',
      description: 'Main contract display name',
    }),
    contract_id: z.string().openapi({
      example: 'plan-001',
      description: "Member's active contract row id (references CRM contract)",
    }),
    joined_at: z.string().date().openapi({
      example: '2024-01-15',
      description: 'Join date',
    }),
    last_visit_date: z.string().date().optional().openapi({
      example: '2024-12-15',
      description: 'Last visit date',
    }),
    has_unpaid: z.boolean().openapi({
      example: false,
      description: 'Whether member has unpaid fees',
    }),
    phone: z.string().openapi({
      example: '090-1234-5678',
      description: 'Phone number',
    }),
    email: z.string().email().openapi({
      example: 'member00001@example.jp',
      description: 'Email address',
    }),
  })
  .openapi({
    title: 'MemberListItem',
    description: 'Member information for list view',
  });

/**
 * Pagination Schema (reused from membership-application)
 */
export const PaginationSchema = z
  .object({
    page: z.number().openapi({
      example: 1,
      description: 'Current page number',
    }),
    limit: z.number().openapi({
      example: 50,
      description: 'Items per page',
    }),
    total: z.number().openapi({
      example: 200,
      description: 'Total number of items',
    }),
    total_pages: z.number().openapi({
      example: 4,
      description: 'Total number of pages',
    }),
  })
  .openapi({
    title: 'Pagination',
    description: 'Pagination information',
  });

/**
 * Get Members Query Schema
 */
export const GetMembersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1).openapi({
      example: 1,
      description: 'Page number',
    }),
    limit: z.coerce.number().int().positive().optional().default(50).openapi({
      example: 50,
      description: 'Items per page',
    }),
    search: z.string().optional().openapi({
      example: '佐藤',
      description: 'Search query (name, member number, phone, email)',
    }),
    contract_type: z.preprocess(
      (val) => {
        if (val === undefined || val === null) return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          return val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [val];
      },
      z
        .array(ContractTypeSchema)
        .optional()
        .openapi({
          example: ['regular', 'family'],
          description: 'Filter by contract type (array)',
        }),
    ),
    status: z.preprocess(
      (val) => {
        if (val === undefined || val === null) return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          return val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [val];
      },
      z
        .array(MemberStatusSchema)
        .optional()
        .openapi({
          example: ['active', 'suspended'],
          description: 'Filter by status (array)',
        }),
    ),
    brand: z.preprocess(
      (val) => {
        if (val === undefined || val === null) return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          return val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [val];
      },
      z
        .array(BrandSchema)
        .optional()
        .openapi({
          example: ['joyfit', 'fit365'],
          description: 'Filter by brand (array)',
        }),
    ),
    store_id: z.preprocess(
      (val) => {
        if (val === undefined || val === null) return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          return val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [val];
      },
      z
        .array(z.string())
        .optional()
        .openapi({
          example: ['store-001', 'store-002'],
          description: 'Filter by store ID (array)',
        }),
    ),
    last_visit_days: z.coerce.number().int().optional().openapi({
      example: 30,
      description: 'Filter by last visit days (-1 for 3+ months)',
    }),
    has_unpaid: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
          if (val === 'true') return true;
          if (val === 'false') return false;
          return undefined;
        }
        return undefined;
      },
      z.boolean().optional().openapi({
        example: true,
        description: 'Filter by unpaid status',
      }),
    ),
    sort_by: z
      .enum(['member_number', 'joined_at', 'last_visit_date', 'name'])
      .optional()
      .default('member_number')
      .openapi({
        example: 'member_number',
        description: 'Sort field',
      }),
    sort_order: z.enum(['asc', 'desc']).optional().default('asc').openapi({
      example: 'asc',
      description: 'Sort order',
    }),
  })
  .openapi({
    title: 'GetMembersQuery',
    description: 'Query parameters for getting members',
  });

/**
 * Get Members Response Schema
 */
export const GetMembersResponseSchema = z
  .object({
    members: z.array(MemberListItemSchema).openapi({
      description: 'List of members',
    }),
    pagination: PaginationSchema.openapi({
      description: 'Pagination information',
    }),
  })
  .openapi({
    title: 'GetMembersResponse',
    description: 'Response for getting members list',
  });

/**
 * Members list / dashboard summary (aggregated KPIs)
 */
export const GetMembersSummaryResponseSchema = z
  .object({
    active_count: z.number().int().nonnegative().openapi({
      example: 1250,
      description: 'Number of active members',
    }),
    active_change_percent: z.number().openapi({
      example: 2.4,
      description: 'Month-over-month change in active members (percent)',
    }),
    suspended_count: z.number().int().nonnegative().openapi({
      example: 42,
      description: 'Number of suspended members',
    }),
    suspended_percent: z.number().openapi({
      example: 3.2,
      description: 'Suspended members as percent of total',
    }),
    unpaid_count: z.number().int().nonnegative().openapi({
      example: 18,
      description: 'Members with unpaid balance',
    }),
    unpaid_total_yen: z.number().int().nonnegative().openapi({
      example: 245000,
      description: 'Total unpaid amount in yen',
    }),
    scheduled_withdrawal_count: z.number().int().nonnegative().openapi({
      example: 7,
      description: 'Members scheduled to withdraw this month',
    }),
    withdrawal_rate_percent: z.number().openapi({
      example: 1.1,
      description: 'Withdrawal rate (percent)',
    }),
  })
  .openapi({
    title: 'GetMembersSummaryResponse',
    description: 'Summary statistics for the members list page',
  });

/**
 * Get Member Detail Response Schema
 */
export const MemberEmergencyContactSchema = z
  .object({
    name: z.string().openapi({ example: '山田 太郎', description: 'Emergency contact name' }),
    relationship: z.string().openapi({ example: '配偶者', description: 'Relationship to member' }),
    phone: z.string().openapi({ example: '090-0000-0000', description: 'Emergency contact phone' }),
  })
  .openapi({
    title: 'MemberEmergencyContact',
    description: 'Emergency contact information',
  });

export const MemberBasicInfoSchema = z
  .object({
    id: z.string().openapi({ example: 'M-00001', description: 'Member ID' }),
    old_member_number: z.string().openapi({
      example: 'O-M-00001',
      description: 'Old member number',
    }),
    member_number: z.string().openapi({ example: 'M-00001', description: 'Member number' }),
    name_kanji: z.string().openapi({ example: '佐藤 花子', description: 'Name in kanji' }),
    name_kana: z.string().openapi({ example: 'サトウ ハナコ', description: 'Name in kana' }),
    birthday: z.string().openapi({ example: '1990-01-01', description: 'Birthday (ISO date)' }),
    age: z.number().int().openapi({ example: 35, description: 'Age' }),
    gender: GenderSchema.openapi({ example: 'female', description: 'Gender' }),
    postal_code: z.string().optional().openapi({ example: '1500002', description: 'Postal code' }),
    prefecture: z.string().optional().openapi({ example: '東京都', description: 'Prefecture' }),
    city: z.string().optional().openapi({ example: '渋谷区', description: 'City' }),
    address: z.string().optional().openapi({ example: '渋谷1-2-3', description: 'Address' }),
    building: z
      .string()
      .optional()
      .openapi({ example: 'サンプルマンション101', description: 'Building' }),
    phone: z.string().openapi({ example: '090-1234-5678', description: 'Phone number' }),
    email: z
      .string()
      .email()
      .openapi({ example: 'member00001@example.jp', description: 'Email address' }),
    emergency_contact: MemberEmergencyContactSchema.optional().openapi({
      description: 'Emergency contact information',
    }),
    notes: z.string().optional().openapi({
      example: '特記事項なし',
      description: 'Other notes',
    }),
  })
  .openapi({
    title: 'MemberBasicInfo',
    description: 'Basic member information',
  });

export const MemberProfileSchema = z
  .object({
    member_type: MemberTypeSchema.openapi({ example: 'regular', description: 'Member type' }),
    status: MemberStatusSchema.openapi({ example: 'active', description: 'Member status' }),
    contract_id: z.string().optional().openapi({
      example: 'plan-001',
      description: "Member's active contract id (CRM contract row)",
    }),
    store_id: z.string().openapi({ example: 'store-001', description: 'Store ID' }),
    store_name: z.string().openapi({ example: 'Fit365八潮店', description: 'Store name' }),
    brand: BrandSchema.openapi({ example: 'joyfit_plus', description: 'Brand' }),
    main_brand: MainBrandSchema.openapi({ example: 'joyfit', description: 'Main brand' }),
    joined_at: z.string().openapi({ example: '2024-01-15', description: 'Join date (ISO date)' }),
    withdrawn_at: z.string().optional().openapi({
      example: '2025-02-01',
      description: 'Withdrawal date (ISO date)',
    }),
    is_black_listed: z.boolean().openapi({ example: false, description: 'Blacklisted status' }),
    gate_stop_info: z
      .object({
        scope: z.enum(['all_stores', 'own_store_only']),
        reason: z.enum(['nuisance', 'unpaid', 'fraudulent_use', 'other']),
        terminal_message: z.string().optional(),
        lock_after_message: z.boolean(),
        set_at: z.string(),
        set_by: z.string(),
      })
      .nullable()
      .optional()
      .openapi({ description: 'Current gate stop info (null when not gate-stopped)' }),
  })
  .openapi({
    title: 'MemberProfile',
    description: 'Member profile',
  });

export const MemberEKYCSchema = z
  .object({
    verified: z.boolean().openapi({ example: true, description: 'Whether eKYC is verified' }),
    verified_at: z.string().optional().openapi({
      example: '2025-01-20T10:00:00.000Z',
      description: 'Verification datetime (ISO)',
    }),
    document_type: z
      .string()
      .optional()
      .openapi({ example: 'driver_license', description: 'Document type' }),
    photoUrl: z
      .string()
      .optional()
      .openapi({ example: 'https://example.com/photo.jpg', description: 'Photo URL' }),
  })
  .openapi({
    title: 'MemberEKYC',
    description: 'eKYC information',
  });

export const MemberConsentSchema = z
  .object({
    member_agreement: z
      .object({
        version: z.string().openapi({ example: '1.0', description: 'Agreement version' }),
        agreed_at: z.string().openapi({
          example: '2025-01-10T10:00:00.000Z',
          description: 'Agreed datetime (ISO)',
        }),
      })
      .openapi({ description: 'Member agreement consent' }),
    privacy_policy: z
      .object({
        version: z.string().openapi({ example: '1.0', description: 'Policy version' }),
        agreed_at: z.string().openapi({
          example: '2025-01-10T10:00:00.000Z',
          description: 'Agreed datetime (ISO)',
        }),
      })
      .openapi({ description: 'Privacy policy consent' }),
    optional_agreement: z
      .object({
        version: z.string().openapi({ example: '1.0', description: 'Optional agreement version' }),
        agreed_at: z.string().openapi({
          example: '2025-01-10T10:00:00.000Z',
          description: 'Agreed datetime (ISO)',
        }),
      })
      .optional()
      .openapi({ description: 'Optional agreement consent' }),
    marketing_consent: z
      .object({
        email: z.boolean().openapi({ example: true, description: 'Email marketing consent' }),
        sms: z.boolean().openapi({ example: false, description: 'SMS marketing consent' }),
        push: z.boolean().openapi({ example: true, description: 'Push marketing consent' }),
      })
      .openapi({ description: 'Marketing consent' }),
  })
  .openapi({
    title: 'MemberConsent',
    description: 'Consent information',
  });

export const MemberHealthInfoSchema = z
  .object({
    health_status: z.string().optional().openapi({ example: '良好', description: 'Health status' }),
    medical_history: z
      .string()
      .optional()
      .openapi({ example: 'なし', description: 'Medical history' }),
    allergies: z.string().optional().openapi({ example: '花粉症', description: 'Allergies' }),
    exercise_restrictions: z.string().optional().openapi({
      example: '膝に負担がかかる運動は避ける',
      description: 'Exercise restrictions',
    }),
  })
  .openapi({
    title: 'MemberHealthInfo',
    description: 'Health information',
  });

export const MemberProfileInfoSchema = z
  .object({
    contract_name: z.string().optional().openapi({
      example: 'レギュラー会員',
      description: 'Main contract display name',
    }),
    join_route: z.string().optional().openapi({
      example: '紹介',
      description: 'Join route',
    }),
    referrer_member_id: z.string().optional().openapi({
      example: 'M-00001',
      description: 'Referrer member ID',
    }),
  })
  .openapi({
    title: 'MemberProfileInfo',
    description: 'Additional member profile information',
  });

export const GetMemberDetailResponseSchema = z
  .object({
    basic_info: MemberBasicInfoSchema.openapi({ description: 'Basic member information' }),
    constraints: z
      .object({
        hasUnpaidFee: z.boolean().openapi({
          example: false,
          description: 'Whether member has unpaid fees',
        }),
        inCancellationPeriod: z.boolean().openapi({
          example: false,
          description: 'Whether member is in cancellation penalty period',
        }),
        isOptionRestricted: z.boolean().openapi({
          example: false,
          description: 'Whether option actions are restricted',
        }),
      })
      .openapi({
        description: 'Constraint flags for member operations',
      }),
    profile: MemberProfileSchema.extend({
      contract_name: z.string().optional().openapi({
        example: 'レギュラー会員',
        description: 'Main contract display name',
      }),
      join_route: z.string().optional().openapi({
        example: '紹介',
        description: 'Join route',
      }),
      referrer_member_id: z.string().optional().openapi({
        example: 'M-00001',
        description: 'Referrer member ID',
      }),
    }).openapi({ description: 'Member profile' }),
    ekyc: MemberEKYCSchema.optional().openapi({ description: 'eKYC information' }),
    consent: MemberConsentSchema.optional().openapi({ description: 'Consent information' }),
    health_info: MemberHealthInfoSchema.optional().openapi({
      description: 'Health information',
    }),
  })
  .openapi({
    title: 'GetMemberDetailResponse',
    description: 'Response for getting member detail',
  });

/**
 * Create Member Request Schema
 */
export const CreateMemberRequestSchema = z
  .object({
    name_kanji: z.string().min(1).openapi({
      example: '佐藤 花子',
      description: 'Name in kanji',
    }),
    name_kana: z.string().min(1).openapi({
      example: 'サトウ ハナコ',
      description: 'Name in kana',
    }),
    birthday: z.string().optional().openapi({
      example: '1990-05-20',
      description: 'Birthday (ISO date)',
    }),
    gender: GenderSchema.optional().openapi({
      example: 'female',
      description: 'Gender',
    }),
    postal_code: z.string().optional().openapi({
      example: '1500001',
      description: 'Postal code',
    }),
    prefecture: z.string().optional().openapi({
      example: '東京都',
      description: 'Prefecture',
    }),
    city: z.string().optional().openapi({
      example: '渋谷区',
      description: 'City',
    }),
    address: z.string().optional().openapi({
      example: '神宮前1-1-1',
      description: 'Address',
    }),
    building: z.string().optional().openapi({
      example: 'サンプルビル 5F',
      description: 'Building name',
    }),
    phone: z.string().min(1).openapi({
      example: '09012345678',
      description: 'Phone number',
    }),
    email: z.string().email().min(1).openapi({
      example: 'hanako.sato@example.com',
      description: 'Email address',
    }),
    emergency_contact: z
      .object({
        name: z.string(),
        relationship: z.string(),
        phone: z.string(),
      })
      .optional()
      .openapi({
        description: 'Emergency contact information',
      }),
    notes: z.string().optional().openapi({
      example: '特記事項なし',
      description: 'Other notes',
    }),
    profile_info: z
      .object({
        member_type: MemberTypeSchema.optional().openapi({
          example: 'regular',
          description: 'Member type',
        }),
        contract_name: z.string().optional().openapi({
          example: 'レギュラー会員',
          description: 'Main contract display name',
        }),
        join_date: z.string().optional().openapi({
          example: '2024-01-15',
          description: 'Join date (ISO date)',
        }),
        join_store: z.string().optional().openapi({
          example: 'Fit365八潮店',
          description: 'Join store name',
        }),
        brand: z.string().optional().openapi({
          example: 'fit365',
          description: 'Brand',
        }),
        join_route: z.string().optional().openapi({
          example: '紹介',
          description: 'Join route',
        }),
        referrer_member_id: z.string().optional().openapi({
          example: 'M-00001',
          description: 'Referrer member ID',
        }),
        photo_url: z.string().optional().openapi({
          example: 'https://example.com/photo.jpg',
          description: 'Member photo URL',
        }),
      })
      .optional()
      .openapi({
        description: 'Additional member profile information',
      }),
  })
  .openapi({
    title: 'CreateMemberRequest',
    description: 'Request payload for creating a member',
  });

export const CreateMemberResponseSchema = z
  .object({
    message: z.string().openapi({
      example: 'Member created successfully',
    }),
    member: MemberBasicInfoSchema.openapi({
      description: 'Created member basic info',
    }),
  })
  .openapi({
    title: 'CreateMemberResponse',
    description: 'Response for creating a member',
  });

/**
 * Update Basic Info Request Schema
 */
export const UpdateBasicInfoRequestSchema = z
  .object({
    name_kanji: z.string().optional().openapi({
      example: '佐藤 花子',
      description: 'Name in kanji',
    }),
    name_kana: z.string().optional().openapi({
      example: 'サトウ ハナコ',
      description: 'Name in kana',
    }),
    birthday: z.string().optional().openapi({
      example: '1990-05-20',
      description: 'Birthday (ISO date)',
    }),
    gender: GenderSchema.optional().openapi({
      example: 'female',
      description: 'Gender',
    }),
    postal_code: z.string().optional().openapi({
      example: '1500002',
      description: 'Postal code',
    }),
    prefecture: z.string().optional().openapi({
      example: '東京都',
      description: 'Prefecture',
    }),
    city: z.string().optional().openapi({
      example: '渋谷区',
      description: 'City',
    }),
    address: z.string().optional().openapi({
      example: '渋谷1-2-3',
      description: 'Address',
    }),
    building: z.string().optional().openapi({
      example: 'サンプルマンション 101',
      description: 'Building name',
    }),
    phone: z.string().optional().openapi({
      example: '09012345678',
      description: 'Phone number',
    }),
    email: z.string().email().optional().openapi({
      example: 'hanako.sato@example.com',
      description: 'Email address',
    }),
    emergency_contact: z
      .object({
        name: z.string(),
        relationship: z.string(),
        phone: z.string(),
      })
      .optional()
      .openapi({
        description: 'Emergency contact information',
      }),
    notes: z.string().optional().openapi({
      example: '特記事項なし',
      description: 'Other notes',
    }),
  })
  .openapi({
    title: 'UpdateBasicInfoRequest',
    description: 'Request payload for updating basic info',
  });

/**
 * Update Basic Info Response Schema
 */
export const UpdateBasicInfoResponseSchema = MemberBasicInfoSchema.openapi({
  title: 'UpdateBasicInfoResponse',
  description: 'Response for updating basic info',
});

/**
 * Update Health Info Request Schema
 */
export const UpdateHealthInfoRequestSchema = z
  .object({
    health_status: z.string().optional().openapi({
      example: '良好',
      description: 'Health status',
    }),
    medical_history: z.string().optional().openapi({
      example: '特になし',
      description: 'Medical history',
    }),
    allergies: z.string().optional().openapi({
      example: 'なし',
      description: 'Allergies',
    }),
    exercise_restrictions: z.string().optional().openapi({
      example: '特になし',
      description: 'Exercise restrictions',
    }),
  })
  .openapi({
    title: 'UpdateHealthInfoRequest',
    description: 'Request payload for updating health info',
  });

/**
 * Update Health Info Response Schema
 */
export const UpdateHealthInfoResponseSchema = MemberHealthInfoSchema.openapi({
  title: 'UpdateHealthInfoResponse',
  description: 'Response for updating health info',
});

/**
 * Update Marketing Consent Request Schema
 */
export const UpdateMarketingConsentRequestSchema = z
  .object({
    email: z.boolean().optional().openapi({
      example: true,
      description: 'Email marketing consent',
    }),
    sms: z.boolean().optional().openapi({
      example: false,
      description: 'SMS marketing consent',
    }),
    push: z.boolean().optional().openapi({
      example: true,
      description: 'Push notification consent',
    }),
  })
  .openapi({
    title: 'UpdateMarketingConsentRequest',
    description: 'Request payload for updating marketing consent',
  });

/**
 * Update Marketing Consent Response Schema
 */
export const UpdateMarketingConsentResponseSchema =
  MemberConsentSchema.shape.marketing_consent.openapi({
    title: 'UpdateMarketingConsentResponse',
    description: 'Response for updating marketing consent',
  });

/**
 * Update Member Request Schema
 */
export const UpdateMemberRequestSchema = z
  .object({
    basic_info: UpdateBasicInfoRequestSchema.optional().openapi({
      description: 'Basic member information',
    }),
    profile_info: z
      .object({
        member_type: MemberTypeSchema.optional().openapi({
          example: 'regular',
          description: 'Member type',
        }),
        contract_name: z.string().optional().openapi({
          example: 'レギュラー会員',
          description: 'Main contract display name',
        }),
        join_date: z.string().optional().openapi({
          example: '2024-01-15',
          description: 'Join date (ISO date)',
        }),
        join_store: z.string().optional().openapi({
          example: 'Fit365八潮店',
          description: 'Join store name',
        }),
        brand: z.string().optional().openapi({
          example: 'fit365',
          description: 'Brand',
        }),
        join_route: z.string().optional().openapi({
          example: '紹介',
          description: 'Join route',
        }),
        referrer_member_id: z.string().optional().openapi({
          example: 'M-00001',
          description: 'Referrer member ID',
        }),
        photo_url: z.string().optional().openapi({
          example: 'https://example.com/photo.jpg',
          description: 'Member photo URL',
        }),
      })
      .optional()
      .openapi({
        description: 'Additional member profile information',
      }),
  })
  .openapi({
    title: 'UpdateMemberRequest',
    description: 'Request payload for updating a member',
  });

export const UpdateMemberResponseSchema = GetMemberDetailResponseSchema.openapi({
  title: 'UpdateMemberResponse',
  description: 'Response for updating a member',
});

/**
 * Point Adjustment Type Schema
 */
export const PointAdjustmentTypeSchema = z.enum(['add', 'subtract']).openapi({
  title: 'PointAdjustmentType',
  description: 'Adjustment type',
});

/**
 * Point Adjustment Request Schema
 */
export const PointAdjustmentRequestSchema = z
  .object({
    type: PointAdjustmentTypeSchema.openapi({
      example: 'add',
      description: 'Adjustment type',
    }),
    points: z.number().int().positive().openapi({
      example: 100,
      description: 'Number of points',
    }),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason must be at most 500 characters')
      .openapi({
        example: 'キャンペーン漏れ分の手動付与',
        description: 'Reason for adjustment (10-500 characters)',
      }),
  })
  .openapi({
    title: 'PointAdjustmentRequest',
    description: 'Request payload for adjusting points',
  });

/**
 * Point Adjustment Response Schema
 */
export const PointAdjustmentResponseSchema = z
  .object({
    id: z.string().openapi({
      example: 'M-00001',
      description: 'Member ID',
    }),
    adjustment: PointAdjustmentRequestSchema.openapi({
      description: 'Adjustment details',
    }),
  })
  .openapi({
    title: 'PointAdjustmentResponse',
    description: 'Response for adjusting points',
  });

export const GetPointsPeriodSchema = z
  .enum(['all', 'this_month', 'last_3_months', 'last_1_year'])
  .openapi({
    title: 'GetPointsPeriod',
    description: 'Time period filter for point history',
  });

export const GetPointsQuerySchema = z
  .object({
    period: GetPointsPeriodSchema.optional().default('all').openapi({
      example: 'all',
      description: 'Point history period filter',
    }),
  })
  .openapi({
    title: 'GetPointsQuery',
    description: 'Query parameters for getting points',
  });

export const PointHistoryItemSchema = z
  .object({
    id: z.string().openapi({
      example: 'earn-001',
      description: 'Point history ID',
    }),
    date: z.string().openapi({
      example: '2025-03-10T10:00:00+09:00',
      description: 'Point transaction datetime (ISO)',
    }),
    reason: z.string().openapi({
      example: '来館',
      description: 'Point transaction reason',
    }),
    points: z.number().int().nonnegative().openapi({
      example: 100,
      description: 'Point amount',
    }),
  })
  .openapi({
    title: 'PointHistoryItem',
    description: 'Point history row',
  });

/**
 * Get Points Response Schema (simplified)
 */
export const GetPointsResponseSchema = z
  .object({
    point_balance: z.number().int().nonnegative().openapi({
      example: 1200,
      description: 'Current point balance',
    }),
    period: GetPointsPeriodSchema.openapi({
      example: 'all',
      description: 'Applied period filter',
    }),
    earn_history: z.array(PointHistoryItemSchema).openapi({
      description: 'Earn history list',
    }),
    spend_history: z.array(PointHistoryItemSchema).openapi({
      description: 'Spend history list',
    }),
  })
  .openapi({
    title: 'GetPointsResponse',
    description: 'Response for getting points',
  });

/**
 * Memo Type Schema
 */
export const MemoTypeSchema = z.enum(['caution', 'vip', 'other']).openapi({
  title: 'MemoType',
  description: 'Staff memo type',
});

/**
 * Staff Memo Schema
 */
export const StaffMemoSchema = z
  .object({
    id: z.string().openapi({ example: 'memo-001', description: 'Memo ID' }),
    date: z
      .string()
      .openapi({ example: '2024-11-15T10:00:00Z', description: 'Created date (ISO)' }),
    type: MemoTypeSchema.openapi({ example: 'caution', description: 'Memo type' }),
    content: z.string().openapi({ example: '注意事項があります', description: 'Memo content' }),
    created_by: z.string().openapi({ example: '山田 花子', description: 'Creator name' }),
  })
  .openapi({
    title: 'StaffMemo',
    description: 'Staff memo',
  });

/**
 * Create Memo Request Schema
 */
export const CreateMemoRequestSchema = z
  .object({
    type: MemoTypeSchema.openapi({
      example: 'caution',
      description: 'Memo type',
    }),
    content: z
      .string()
      .min(1, 'Content is required')
      .max(1000, 'Content must be at most 1000 characters')
      .openapi({
        example: '注意事項があります',
        description: 'Memo content (1-1000 characters)',
      }),
    created_by: z.string().optional().openapi({
      example: '山田 花子',
      description: 'Creator name',
    }),
  })
  .openapi({
    title: 'CreateMemoRequest',
    description: 'Request payload for creating a memo',
  });

/**
 * Create Memo Response Schema
 */
export const CreateMemoResponseSchema = StaffMemoSchema.openapi({
  title: 'CreateMemoResponse',
  description: 'Response for creating a memo',
});

/**
 * Update Memo Request Schema
 */
export const UpdateMemoRequestSchema = z
  .object({
    type: MemoTypeSchema.optional().openapi({
      example: 'caution',
      description: 'Memo type',
    }),
    content: z.string().max(1000, 'Content must be at most 1000 characters').optional().openapi({
      example: '更新された注意事項',
      description: 'Memo content (max 1000 characters)',
    }),
  })
  .openapi({
    title: 'UpdateMemoRequest',
    description: 'Request payload for updating a memo',
  });

/**
 * Update Memo Response Schema
 */
export const UpdateMemoResponseSchema = StaffMemoSchema.openapi({
  title: 'UpdateMemoResponse',
  description: 'Response for updating a memo',
});

/**
 * Get Memos Response Schema
 */
export const GetMemosResponseSchema = z
  .object({
    memos: z.array(StaffMemoSchema).openapi({
      description: 'List of memos',
    }),
  })
  .openapi({
    title: 'GetMemosResponse',
    description: 'Response for getting memos',
  });

/**
 * Export Members Request Schema
 */
export const ExportMembersRequestSchema = z
  .object({
    format: z.enum(['csv', 'excel']).openapi({
      example: 'csv',
      description: 'Export format',
    }),
    target: z.enum(['selected', 'filtered']).openapi({
      example: 'selected',
      description: 'Export target',
    }),
    member_ids: z
      .array(z.string())
      .optional()
      .openapi({
        example: ['M-00001', 'M-00002'],
        description: 'Member IDs (for selected target)',
      }),
    fields: z
      .array(z.string())
      .min(1, 'At least one field must be selected')
      .openapi({
        example: ['member_number', 'name_kanji', 'email'],
        description: 'Fields to export',
      }),
  })
  .refine(
    (data) => {
      if (data.target === 'filtered' && data.member_ids && data.member_ids.length > 10000) {
        return false;
      }
      return true;
    },
    {
      message: 'Export limit is 10,000 members',
    },
  )
  .openapi({
    title: 'ExportMembersRequest',
    description: 'Request payload for exporting members',
  });

export const ExportMembersStatusSchema = z
  .enum(['processing', 'completed', 'failed'])
  .openapi({ title: 'ExportMembersStatus', description: 'Export job status' });

/**
 * Export Members Response Schema
 */
export const ExportMembersResponseSchema = z
  .object({
    exportId: z.string().openapi({
      example: 'export-1234567890',
      description: 'Export ID',
    }),
    format: z.enum(['csv', 'excel']).openapi({
      example: 'csv',
      description: 'Export format',
    }),
    status: ExportMembersStatusSchema.openapi({
      example: 'processing',
      description: 'Export status',
    }),
  })
  .openapi({
    title: 'ExportMembersResponse',
    description: 'Response for exporting members',
  });

/**
 * Contract Change Schema
 */
export const ContractChangeSchema = z
  .object({
    changed_at: z.string().openapi({
      example: '2024-01-15T00:00:00+09:00',
      description: 'Change date and time',
    }),
    previous_plan: z.string().openapi({
      example: 'レギュラー会員',
      description: 'Previous main contract display name',
    }),
    new_plan: z.string().openapi({
      example: 'ナイト会員',
      description: 'New main contract display name',
    }),
    reason: z.string().optional().openapi({
      example: 'プラン変更希望',
      description: 'Reason for change',
    }),
  })
  .openapi({
    title: 'ContractChange',
    description: 'Contract change history item',
  });

/**
 * Main Contract Schema
 */
export const MainContractSchema = z
  .object({
    plan_name: z.string().openapi({
      example: 'スタンダードプラン',
      description: 'Plan name',
    }),
    monthly_fee: z.number().openapi({
      example: 8580,
      description: 'Monthly fee (tax included)',
    }),
    start_date: z.string().openapi({
      example: '2024-01-15',
      description: 'Contract start date',
    }),
    penalty_period_end: z.string().optional().openapi({
      example: '2025-01-14',
      description: 'Penalty period end date',
    }),
    change_history: z.array(ContractChangeSchema).openapi({
      description: 'Contract change history',
    }),
  })
  .openapi({
    title: 'MainContract',
    description: 'Main contract information',
  });

export const GetMainContractResponseSchema = MainContractSchema.openapi({
  title: 'GetMainContractResponse',
  description: 'Response for getting member main contract',
});

export const ChangeMainContractRequestSchema = z
  .object({
    contract_id: z.string().min(1).openapi({
      example: 'MC002',
      description: 'New main contract id',
    }),
  })
  .openapi({
    title: 'ChangeMainContractRequest',
    description: 'Request payload for changing member main contract',
  });

export const ChangeMainContractResponseSchema = MainContractSchema.openapi({
  title: 'ChangeMainContractResponse',
  description: 'Updated member main contract after change request',
});

/**
 * Option Contract Schema
 */
export const OptionContractSchema = z
  .object({
    id: z.string().openapi({
      example: 'opt-001',
      description: 'Option contract ID',
    }),
    name: z.string().openapi({
      example: 'パーソナルトレーニング',
      description: 'Option name',
    }),
    monthly_fee: z.number().openapi({
      example: 11000,
      description: 'Monthly fee',
    }),
    start_date: z.string().openapi({
      example: '2024-02-01',
      description: 'Start date',
    }),
    next_billing_date: z.string().openapi({
      example: '2025-03-01',
      description: 'Next billing date',
    }),
  })
  .openapi({
    title: 'OptionContract',
    description: 'Option contract information',
  });

export const GetOptionContractsResponseSchema = z.array(OptionContractSchema).openapi({
  title: 'GetOptionContractsResponse',
  description: 'Response for getting member option contracts',
});

export const AddOptionContractRequestSchema = z
  .object({
    option_id: z.string().min(1).openapi({
      example: 'OP002',
      description: 'Option master id to add',
    }),
    apply_from: z.enum(['today', 'next_month']).openapi({
      example: 'today',
      description: 'When to start applying the option',
    }),
  })
  .openapi({
    title: 'AddOptionContractRequest',
    description: 'Request payload for adding a member option contract',
  });

export const AddOptionContractResponseSchema = OptionContractSchema.openapi({
  title: 'AddOptionContractResponse',
  description: 'Added option contract',
});

export const ChangeOptionContractRequestSchema = z
  .object({
    current_option_id: z.string().min(1).openapi({
      example: 'OP002',
      description: 'Current option contract id',
    }),
    next_option_id: z.string().min(1).openapi({
      example: 'OP003',
      description: 'Next option master id',
    }),
  })
  .openapi({
    title: 'ChangeOptionContractRequest',
    description: 'Request payload for changing a member option contract',
  });

export const ChangeOptionContractResponseSchema = z
  .object({
    removed_option_id: z.string().openapi({
      example: 'OP002',
      description: 'Removed option contract id',
    }),
    added_option: OptionContractSchema.openapi({
      description: 'Newly added option contract',
    }),
  })
  .openapi({
    title: 'ChangeOptionContractResponse',
    description: 'Changed option contract result',
  });

export const CancelOptionContractRequestSchema = z
  .object({
    option_id: z.string().min(1).openapi({
      example: 'OP003',
      description: 'Option contract id to cancel',
    }),
    cancel_timing: z.enum(['immediate', 'end_of_next_month']).openapi({
      example: 'immediate',
      description: 'When to cancel the option contract',
    }),
    reason: z.string().optional().openapi({
      example: '利用しなくなったため',
      description: 'Cancel reason',
    }),
  })
  .openapi({
    title: 'CancelOptionContractRequest',
    description: 'Request payload for cancelling a member option contract',
  });

export const CancelOptionContractResponseSchema = z
  .object({
    cancelled_option_id: z.string().openapi({
      example: 'OP003',
      description: 'Cancelled option contract id',
    }),
  })
  .openapi({
    title: 'CancelOptionContractResponse',
    description: 'Cancelled option contract result',
  });

/**
 * Option Change History Schema
 */
export const OptionChangeHistorySchema = z
  .object({
    changed_at: z.string().openapi({
      example: '2024-02-01T00:00:00+09:00',
      description: 'Change date and time',
    }),
    option_name: z.string().openapi({
      example: 'パーソナルトレーニング',
      description: 'Option name',
    }),
    action_type: z.enum(['add', 'remove']).openapi({
      example: 'add',
      description: 'Action type',
    }),
    notes: z.string().optional().openapi({
      example: 'オプション追加',
      description: 'Notes',
    }),
  })
  .openapi({
    title: 'OptionChangeHistory',
    description: 'Option change history item',
  });

/**
 * Special Contract Item Schema
 */
export const SpecialContractItemSchema = z
  .object({
    enrolled: z.boolean().openapi({
      example: true,
      description: 'Whether enrolled',
    }),
    start_date: z.string().optional().openapi({
      example: '2024-01-15',
      description: 'Start date',
    }),
    applied_month: z.string().optional().openapi({
      example: '2025-03',
      description: 'Applied month (YYYY-MM format)',
    }),
  })
  .openapi({
    title: 'SpecialContractItem',
    description: 'Special contract item',
  });

/**
 * Special Contracts Schema
 */
export const SpecialContractsSchema = z
  .object({
    anshin_support: SpecialContractItemSchema.optional().openapi({
      description: 'Anshin support contract',
    }),
    mutual_use: SpecialContractItemSchema.optional().openapi({
      description: 'Mutual use contract',
    }),
    security_fee: SpecialContractItemSchema.optional().openapi({
      description: 'Security fee contract',
    }),
    maintenance_fee: SpecialContractItemSchema.optional().openapi({
      description: 'Maintenance fee contract',
    }),
  })
  .openapi({
    title: 'SpecialContracts',
    description: 'Special contracts information',
  });

/**
 * Payment Record Schema
 */
export const PaymentRecordSchema = z
  .object({
    date: z.string().openapi({
      example: '2025-02-27',
      description: 'Payment date',
    }),
    amount: z.number().openapi({
      example: 9680,
      description: 'Payment amount',
    }),
    breakdown: z.string().openapi({
      example: '月会費 8,580円 + オプション 1,100円',
      description: 'Payment breakdown',
    }),
    status: z.enum(['success', 'failed']).openapi({
      example: 'success',
      description: 'Payment status',
    }),
    notes: z.string().optional().openapi({
      example: '',
      description: 'Additional notes',
    }),
  })
  .openapi({
    title: 'PaymentRecord',
    description: 'Payment history record',
  });

/**
 * Payment Info Schema
 */
export const PaymentInfoSchema = z
  .object({
    method: z.enum(['credit_card', 'bank_transfer']).openapi({
      example: 'credit_card',
      description: 'Payment method',
    }),
    card_number: z.string().optional().openapi({
      example: '**** **** **** 1234',
      description: 'Masked card number (last 4 digits only)',
    }),
    cardholder_name: z.string().optional().openapi({
      example: 'SATOU HANAKO',
      description: 'Cardholder name',
    }),
    expiry_date: z.string().optional().openapi({
      example: '12/28',
      description: 'Card expiry date',
    }),
    billing_day: z.number().int().min(1).max(31).openapi({
      example: 27,
      description: 'Billing day of month',
    }),
    last_payment_date: z.string().optional().openapi({
      example: '2025-02-27',
      description: 'Last payment date',
    }),
    last_payment_amount: z.number().optional().openapi({
      example: 9680,
      description: 'Last payment amount',
    }),
    status: z.enum(['normal', 'error']).openapi({
      example: 'normal',
      description: 'Payment status',
    }),
    payment_history: z.array(PaymentRecordSchema).openapi({
      description: 'Payment history',
    }),
  })
  .openapi({
    title: 'PaymentInfo',
    description: 'Payment information',
  });

/**
 * Unpaid Info Schema
 */
export const UnpaidInfoSchema = z
  .object({
    amount: z.number().openapi({
      example: 5000,
      description: 'Unpaid amount',
    }),
    due_date: z.string().openapi({
      example: '2025-03-15',
      description: 'Due date',
    }),
    reason: z.string().optional().openapi({
      example: 'Payment failed',
      description: 'Reason for unpaid',
    }),
  })
  .openapi({
    title: 'UnpaidInfo',
    description: 'Unpaid information',
  });

/**
 * Campaign Schema
 */
export const CampaignSchema = z
  .object({
    campaign_name: z.string().openapi({
      example: '春の入会キャンペーン',
      description: 'Campaign name',
    }),
    period_start: z.string().optional().openapi({
      example: '2025-03-01',
      description: 'Campaign period start date',
    }),
    period_end: z.string().optional().openapi({
      example: '2025-03-31',
      description: 'Campaign period end date',
    }),
    discount_content: z.string().optional().openapi({
      example: '入会金50%OFF',
      description: 'Discount content',
    }),
    remaining_days: z.number().optional().openapi({
      example: 15,
      description: 'Remaining days',
    }),
    applied_at: z.string().optional().openapi({
      example: '2024-01-15',
      description: 'Applied date',
    }),
    content: z.string().optional().openapi({
      example: '初月月会費無料',
      description: 'Campaign content',
    }),
    status: CampaignStatusSchema.optional().openapi({
      example: 'expired',
      description: 'Campaign status',
    }),
  })
  .openapi({
    title: 'Campaign',
    description: 'Campaign information',
  });

/**
 * Campaigns Schema
 */
export const CampaignsSchema = z
  .object({
    active: z.array(CampaignSchema).openapi({
      description: 'Active campaigns',
    }),
    history: z.array(CampaignSchema).openapi({
      description: 'Campaign history',
    }),
  })
  .openapi({
    title: 'Campaigns',
    description: 'Campaign information',
  });

/**
 * Day Pass Record Schema
 */
export const DayPassRecordSchema = z
  .object({
    id: z.string().openapi({ example: 'dp-001', description: 'Day pass record ID' }),
    purchased_at: z.string().openapi({
      example: '2025-03-10',
      description: 'Purchase date',
    }),
    store_name: z.string().openapi({
      example: 'JOYFIT渋谷店',
      description: 'Store used for the day pass',
    }),
    amount: z.number().openapi({ example: 1100, description: 'Purchase amount (tax included)' }),
    expires_at: z.string().openapi({
      example: '2025-03-10',
      description: 'Expiry date of the day pass',
    }),
    status: z.enum(['used', 'unused', 'expired']).openapi({
      title: 'DayPassStatus',
      example: 'used',
      description: 'Day pass status',
    }),
  })
  .openapi({ title: 'DayPassRecord', description: 'Day pass purchase record' });

/**
 * Get Day Pass History Response Schema
 */
export const GetDayPassHistoryResponseSchema = z
  .object({
    day_pass_history: z.array(DayPassRecordSchema).openapi({
      description: 'Day pass purchase history records',
    }),
  })
  .openapi({
    title: 'GetDayPassHistoryResponse',
    description: 'Response for getting member day pass purchase history',
  });

/**
 * Get Campaigns Response Schema
 */
export const GetCampaignsResponseSchema = CampaignsSchema.openapi({
  title: 'GetCampaignsResponse',
  description: 'Response for getting member campaigns',
});

/**
 * Get Payment History Response Schema
 */
export const GetPaymentHistoryResponseSchema = z
  .object({
    payment_history: z.array(PaymentRecordSchema).openapi({
      description: 'Payment history records',
    }),
  })
  .openapi({
    title: 'GetPaymentHistoryResponse',
    description: 'Response for getting member payment history',
  });

/**
 * Get Contract Summary Response Schema
 */
export const GetContractSummaryResponseSchema = z
  .object({
    plan_name: z.string().nullable().openapi({
      example: 'レギュラー会員',
      description: 'Main contract plan name',
    }),
    total_monthly_fee: z.number().openapi({
      example: 9680,
      description: 'Total monthly fee (main + options, tax included)',
    }),
    billing_day: z.number().int().min(1).max(31).nullable().openapi({
      example: 27,
      description: 'Billing day of month',
    }),
    payment_method: z.enum(['credit_card', 'bank_transfer']).nullable().openapi({
      example: 'credit_card',
      description: 'Payment method',
    }),
    unpaid_amount: z.number().openapi({
      example: 0,
      description: 'Unpaid amount (0 if none)',
    }),
  })
  .openapi({
    title: 'GetContractSummaryResponse',
    description: 'Response for getting member contract summary',
  });

/**
 * Get Usage Status Response Schema
 */
export const GetUsageStatusResponseSchema = z
  .object({
    monthly_visits: z.number().int().openapi({
      example: 12,
      description: 'Number of visits in the current month',
    }),
    monthly_visits_diff: z.number().int().openapi({
      example: 3,
      description: 'Difference in visits compared to the previous month',
    }),
    peak_time_slot: z.string().nullable().openapi({
      example: '18:00-20:00',
      description: 'Most frequently used time slot',
    }),
    frequent_store: z.string().nullable().openapi({
      example: 'JOYFIT渋谷店',
      description: 'Most frequently visited store name',
    }),
  })
  .openapi({
    title: 'GetUsageStatusResponse',
    description: 'Response for getting member usage status',
  });

/**
 * Get Training Records Request Schema
 */
export const TrainingRecordsPeriodSchema = z.enum(['all', 'this_month', 'last_3_months']).openapi({
  title: 'TrainingRecordsPeriod',
  description: 'Period filter for training records',
  example: 'all',
});

export const GetTrainingRecordsPathParamsSchema = z.object({
  id: z.string().openapi({
    description: 'Member ID',
    example: 'M-00001',
  }),
});

export const GetTrainingRecordsQuerySchema = z.object({
  period: TrainingRecordsPeriodSchema.optional().default('all'),
});

/**
 * Get Training Records Response Schema
 */
export const TrainingRecordItemSchema = z
  .object({
    id: z.string().openapi({
      description: 'Training record ID',
      example: 'training-001',
    }),
    date: z.string().openapi({
      description: 'Training date',
      example: '2026-04-17',
    }),
    routineName: z.string().openapi({
      description: 'Routine name',
      example: '全身強化',
    }),
    durationMin: z.number().int().nonnegative().openapi({
      description: 'Training duration in minutes',
      example: 55,
    }),
    calories: z.number().int().nonnegative().openapi({
      description: 'Calories burned',
      example: 360,
    }),
  })
  .openapi({
    title: 'TrainingRecordItem',
    description: 'Single training history record',
  });

export const TrainingRecordSummarySchema = z
  .object({
    trainingCount: z.number().int().nonnegative().openapi({
      description: 'Number of training sessions',
      example: 8,
    }),
    totalDurationMin: z.number().int().nonnegative().openapi({
      description: 'Total duration in minutes',
      example: 435,
    }),
    totalCalories: z.number().int().nonnegative().openapi({
      description: 'Total burned calories',
      example: 2790,
    }),
    mostFrequentRoutineName: z.string().nullable().openapi({
      description: 'Most frequently trained routine',
      example: '全身強化',
    }),
  })
  .openapi({
    title: 'TrainingRecordSummary',
    description: 'Aggregated training summary',
  });

export const GetTrainingRecordsResponseSchema = z
  .object({
    summary: TrainingRecordSummarySchema.openapi({
      description: 'Training summary',
    }),
    trainingHistory: z.array(TrainingRecordItemSchema).openapi({
      description: 'Training history list',
    }),
  })
  .openapi({
    title: 'GetTrainingRecordsResponse',
    description: 'Response for getting training records',
  });

/**
 * Get Body Data Request Schema
 */
export const BodyDataSourceSchema = z.enum(['body_planner', '3d_scanner', 'manual']).openapi({
  title: 'BodyDataSource',
  description: 'Body data source',
  example: 'body_planner',
});

export const GetBodyDataPathParamsSchema = z.object({
  id: z.string().openapi({
    description: 'Member ID',
    example: 'M-00001',
  }),
});

export const BodyDataLatestSummarySchema = z
  .object({
    date: z.string().openapi({
      description: 'Latest measurement date',
      example: '2026-04-17',
    }),
    weight: z.number().openapi({
      description: 'Weight in kg',
      example: 68.4,
    }),
    bmi: z.number().openapi({
      description: 'Body mass index',
      example: 22.8,
    }),
    fatPercent: z.number().openapi({
      description: 'Body fat percentage',
      example: 18.2,
    }),
    muscleMass: z.number().openapi({
      description: 'Muscle mass in kg',
      example: 29.6,
    }),
    basalMetabolism: z.number().int().openapi({
      description: 'Basal metabolism in kcal',
      example: 1580,
    }),
  })
  .openapi({
    title: 'BodyDataLatestSummary',
    description: 'Latest body data summary',
  });

export const BodyCompositionSchema = z
  .object({
    source: BodyDataSourceSchema.openapi({
      description: 'Body composition data source',
    }),
    weight: z.number().openapi({ description: 'Weight in kg', example: 68.4 }),
    bmi: z.number().openapi({ description: 'Body mass index', example: 22.8 }),
    fatPercent: z.number().openapi({ description: 'Body fat percentage', example: 18.2 }),
    fatMass: z.number().openapi({ description: 'Body fat mass in kg', example: 12.5 }),
    visceralFatIndex: z.number().openapi({ description: 'Visceral fat index', example: 7.4 }),
    smi: z.number().openapi({ description: 'Skeletal muscle index', example: 7.6 }),
    muscleMass: z.number().openapi({ description: 'Muscle mass in kg', example: 29.6 }),
    boneMass: z.number().openapi({ description: 'Estimated bone mass in kg', example: 2.9 }),
    waterContent: z.number().openapi({ description: 'Water content in kg', example: 41.2 }),
    basalMetabolism: z.number().int().openapi({
      description: 'Basal metabolism in kcal',
      example: 1580,
    }),
    leanBodyMass: z.number().openapi({ description: 'Lean body mass in kg', example: 55.9 }),
    limbLeanMass: z.number().openapi({ description: 'Limb lean mass in kg', example: 21.4 }),
  })
  .openapi({
    title: 'BodyComposition',
    description: 'Body composition data',
  });

export const BodyMeasurementSchema = z
  .object({
    source: BodyDataSourceSchema.openapi({
      description: 'Body measurement data source',
    }),
    neck: z.number().openapi({ description: 'Neck circumference in cm', example: 37.5 }),
    shoulder: z.number().openapi({ description: 'Shoulder width in cm', example: 47.1 }),
    chest: z.number().openapi({ description: 'Chest circumference in cm', example: 95.4 }),
    waistAbdomen: z.number().openapi({ description: 'Abdomen circumference in cm', example: 81.2 }),
    upperArm: z.number().openapi({ description: 'Upper arm circumference in cm', example: 31.4 }),
    forearm: z.number().openapi({ description: 'Forearm circumference in cm', example: 26.8 }),
    waistHip: z.number().openapi({ description: 'Waist hip circumference in cm', example: 87.3 }),
    hip: z.number().openapi({ description: 'Hip circumference in cm', example: 94.7 }),
    thigh: z.number().openapi({ description: 'Thigh circumference in cm', example: 54.8 }),
    calf: z.number().openapi({ description: 'Calf circumference in cm', example: 37.1 }),
    height: z.number().openapi({ description: 'Height in cm', example: 173.0 }),
  })
  .openapi({
    title: 'BodyMeasurement',
    description: 'Body measurement data',
  });

export const BodyDataHistoryItemSchema = z
  .object({
    id: z.string().openapi({
      description: 'Body data record ID',
      example: 'body-001',
    }),
    date: z.string().openapi({
      description: 'Measurement date',
      example: '2026-04-17',
    }),
    source: BodyDataSourceSchema.openapi({
      description: 'Data source',
    }),
    weight: z.number().openapi({
      description: 'Weight in kg',
      example: 68.4,
    }),
    fatPercent: z.number().openapi({
      description: 'Body fat percentage',
      example: 18.2,
    }),
  })
  .openapi({
    title: 'BodyDataHistoryItem',
    description: 'Single body data history record',
  });

export const BodyWeightChartItemSchema = z
  .object({
    date: z.string().openapi({
      description: 'Measurement date',
      example: '04/17',
    }),
    weight: z.number().openapi({
      description: 'Weight in kg',
      example: 68.4,
    }),
  })
  .openapi({
    title: 'BodyWeightChartItem',
    description: 'Body weight chart data point',
  });

export const GetBodyDataResponseSchema = z
  .object({
    latest: BodyDataLatestSummarySchema.openapi({
      description: 'Latest body data summary',
    }),
    bodyComposition: BodyCompositionSchema.openapi({
      description: 'Body composition details',
    }),
    bodyMeasurement: BodyMeasurementSchema.openapi({
      description: 'Body measurement details',
    }),
    history: z.array(BodyDataHistoryItemSchema).openapi({
      description: 'Body data history list',
    }),
    weightChart: z.array(BodyWeightChartItemSchema).openapi({
      description: 'Body weight chart points',
    }),
  })
  .openapi({
    title: 'GetBodyDataResponse',
    description: 'Response for getting member body data',
  });

/**
 * Get Contracts Response Schema
 */
export const GetContractsResponseSchema = z
  .object({
    main_contract: MainContractSchema.openapi({
      description: 'Main contract information',
    }),
    option_contracts: z.array(OptionContractSchema).openapi({
      description: 'Option contracts',
    }),
    option_change_history: z.array(OptionChangeHistorySchema).openapi({
      description: 'Option change history',
    }),
    special_contracts: SpecialContractsSchema.openapi({
      description: 'Special contracts',
    }),
    payment_info: PaymentInfoSchema.openapi({
      description: 'Payment information',
    }),
    unpaid_info: UnpaidInfoSchema.nullable().openapi({
      description: 'Unpaid information',
    }),
    campaigns: CampaignsSchema.openapi({
      description: 'Campaign information',
    }),
  })
  .openapi({
    title: 'GetContractsResponse',
    description: 'Response for getting contracts',
  });

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      example: 'Failed to process request',
      description: 'Error message',
    }),
  })
  .openapi({
    title: 'ErrorResponse',
    description: 'Error response',
  });

// Type exports for use in route handlers
export type MemberType = z.infer<typeof MemberTypeSchema>;
export type ContractType = z.infer<typeof ContractTypeSchema>;
export type MemberStatus = z.infer<typeof MemberStatusSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type MainBrand = z.infer<typeof MainBrandSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type MemberListItem = z.infer<typeof MemberListItemSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type GetMembersQuery = z.infer<typeof GetMembersQuerySchema>;
export type GetMembersResponse = z.infer<typeof GetMembersResponseSchema>;
export type GetMembersSummaryResponse = z.infer<typeof GetMembersSummaryResponseSchema>;
export type GetMemberDetailResponse = z.infer<typeof GetMemberDetailResponseSchema>;
export type CreateMemberRequest = z.infer<typeof CreateMemberRequestSchema>;
export type CreateMemberResponse = z.infer<typeof CreateMemberResponseSchema>;
export type UpdateMemberRequest = z.infer<typeof UpdateMemberRequestSchema>;
export type UpdateMemberResponse = z.infer<typeof UpdateMemberResponseSchema>;
export type UpdateBasicInfoRequest = z.infer<typeof UpdateBasicInfoRequestSchema>;
export type UpdateBasicInfoResponse = z.infer<typeof UpdateBasicInfoResponseSchema>;
export type UpdateHealthInfoRequest = z.infer<typeof UpdateHealthInfoRequestSchema>;
export type UpdateHealthInfoResponse = z.infer<typeof UpdateHealthInfoResponseSchema>;
export type UpdateMarketingConsentRequest = z.infer<typeof UpdateMarketingConsentRequestSchema>;
export type UpdateMarketingConsentResponse = z.infer<typeof UpdateMarketingConsentResponseSchema>;
export type PointAdjustmentType = z.infer<typeof PointAdjustmentTypeSchema>;
export type PointAdjustmentRequest = z.infer<typeof PointAdjustmentRequestSchema>;
export type PointAdjustmentResponse = z.infer<typeof PointAdjustmentResponseSchema>;
export type GetPointsResponse = z.infer<typeof GetPointsResponseSchema>;
export type MemoType = z.infer<typeof MemoTypeSchema>;
export type StaffMemo = z.infer<typeof StaffMemoSchema>;
export type CreateMemoRequest = z.infer<typeof CreateMemoRequestSchema>;
export type CreateMemoResponse = z.infer<typeof CreateMemoResponseSchema>;
export type UpdateMemoRequest = z.infer<typeof UpdateMemoRequestSchema>;
export type UpdateMemoResponse = z.infer<typeof UpdateMemoResponseSchema>;
export type GetMemosResponse = z.infer<typeof GetMemosResponseSchema>;
export type ExportMembersRequest = z.infer<typeof ExportMembersRequestSchema>;
export type ExportMembersResponse = z.infer<typeof ExportMembersResponseSchema>;
export type ContractChange = z.infer<typeof ContractChangeSchema>;
export type MainContract = z.infer<typeof MainContractSchema>;
export type GetMainContractResponse = z.infer<typeof GetMainContractResponseSchema>;
export type ChangeMainContractRequest = z.infer<typeof ChangeMainContractRequestSchema>;
export type ChangeMainContractResponse = z.infer<typeof ChangeMainContractResponseSchema>;
export type OptionContract = z.infer<typeof OptionContractSchema>;
export type GetOptionContractsResponse = z.infer<typeof GetOptionContractsResponseSchema>;
export type AddOptionContractRequest = z.infer<typeof AddOptionContractRequestSchema>;
export type AddOptionContractResponse = z.infer<typeof AddOptionContractResponseSchema>;
export type ChangeOptionContractRequest = z.infer<typeof ChangeOptionContractRequestSchema>;
export type ChangeOptionContractResponse = z.infer<typeof ChangeOptionContractResponseSchema>;
export type CancelOptionContractRequest = z.infer<typeof CancelOptionContractRequestSchema>;
export type CancelOptionContractResponse = z.infer<typeof CancelOptionContractResponseSchema>;
export type OptionChangeHistory = z.infer<typeof OptionChangeHistorySchema>;
export type SpecialContractItem = z.infer<typeof SpecialContractItemSchema>;
export type SpecialContracts = z.infer<typeof SpecialContractsSchema>;
export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;
export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;
export type UnpaidInfo = z.infer<typeof UnpaidInfoSchema>;
export type DayPassRecord = z.infer<typeof DayPassRecordSchema>;
export type GetDayPassHistoryResponse = z.infer<typeof GetDayPassHistoryResponseSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type Campaigns = z.infer<typeof CampaignsSchema>;
export type GetCampaignsResponse = z.infer<typeof GetCampaignsResponseSchema>;
export type GetPaymentHistoryResponse = z.infer<typeof GetPaymentHistoryResponseSchema>;
export type GetContractSummaryResponse = z.infer<typeof GetContractSummaryResponseSchema>;
export type GetUsageStatusResponse = z.infer<typeof GetUsageStatusResponseSchema>;
export type TrainingRecordsPeriod = z.infer<typeof TrainingRecordsPeriodSchema>;
export type GetTrainingRecordsPathParams = z.infer<typeof GetTrainingRecordsPathParamsSchema>;
export type GetTrainingRecordsQuery = z.infer<typeof GetTrainingRecordsQuerySchema>;
export type TrainingRecordItem = z.infer<typeof TrainingRecordItemSchema>;
export type TrainingRecordSummary = z.infer<typeof TrainingRecordSummarySchema>;
export type GetTrainingRecordsResponse = z.infer<typeof GetTrainingRecordsResponseSchema>;
export type GetContractsResponse = z.infer<typeof GetContractsResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ─── Payment History Schemas (A-01 FR-009-a) ──────────────────────────────

export const PaymentHistoryTypeSchema = z.enum(['sale', 'refund']).openapi({
  title: 'PaymentHistoryType',
  description: 'Payment history type: sale (売上) or refund (返金)',
  example: 'sale',
});

export const PaymentHistoryItemSchema = z
  .object({
    date: z.string().openapi({
      description: 'Date in YYYY/MM/DD format',
      example: '2026/04/01',
    }),
    type: PaymentHistoryTypeSchema,
    content: z.string().openapi({
      description: 'Transaction content description',
      example: '月会費（4月分）',
    }),
    amount: z.number().openapi({
      description: 'Amount in JPY. Negative for refunds.',
      example: 9900,
    }),
    method: z.string().openapi({
      description: 'Payment method',
      example: 'SBPS',
    }),
  })
  .openapi({ title: 'PaymentHistoryItem' });

export const PaymentHistoryListResponseSchema = z
  .object({
    items: z.array(PaymentHistoryItemSchema).openapi({
      description: 'Payment history records',
    }),
    total: z.number().openapi({
      description: 'Total number of records',
    }),
    page: z.number().openapi({
      description: 'Current page number (1-based)',
    }),
    limit: z.number().openapi({
      description: 'Number of records per page',
    }),
  })
  .openapi({
    title: 'PaymentHistoryListResponse',
    description: 'Paginated payment history response',
  });

export type PaymentHistoryListResponse = z.infer<typeof PaymentHistoryListResponseSchema>;

// ─── Billing Schemas (A-01 FR-009-b) ──────────────────────────────

export const BillingStatusSchema = z
  .enum(['pending', 'paid', 'uncollected', 'written-off'])
  .openapi({
    title: 'BillingStatus',
    description:
      'Billing status: pending (未確定), paid (入金済み), uncollected (未回収), written-off (貸倒)',
    example: 'paid',
  });

export const BillingTypeSchema = z.enum(['monthly', 'oneTime']).openapi({
  title: 'BillingType',
  description: 'Billing type: monthly (月次) or oneTime (都度)',
  example: 'monthly',
});

export const BillingItemSchema = z
  .object({
    month: z.string().openapi({
      description: 'Billing month in Japanese format',
      example: '2026年4月',
    }),
    type: BillingTypeSchema,
    amount: z.number().openapi({
      description: 'Billing amount in JPY',
      example: 9900,
    }),
    status: BillingStatusSchema,
    billingDate: z.string().openapi({
      description: 'Billing date in YYYY/MM/DD format',
      example: '2026/04/01',
    }),
  })
  .openapi({ title: 'BillingItem' });

export const GetBillingResponseSchema = z
  .object({
    items: z.array(BillingItemSchema).openapi({
      description: 'Billing records',
    }),
    total: z.number().openapi({
      description: 'Total number of billing records',
    }),
    page: z.number().openapi({
      description: 'Current page number (1-based)',
    }),
    limit: z.number().openapi({
      description: 'Number of records per page',
    }),
  })
  .openapi({
    title: 'GetBillingResponse',
    description: 'Paginated billing list response',
  });

export type GetBillingResponse = z.infer<typeof GetBillingResponseSchema>;

// ─── Payment Summary Schema (A-01 FR-009-c) ──────────────────────────────

export const PaymentSummarySchema = z
  .object({
    currentMonthAmount: z.number().openapi({
      description: 'Total billing amount for current month in JPY',
      example: 9900,
    }),
    unpaidTotal: z.number().openapi({
      description: 'Total unpaid/written-off amount in JPY',
      example: 0,
    }),
    lastPaymentDate: z.string().nullable().openapi({
      description: 'Last payment date in YYYY/MM/DD format, or null',
      example: '2026/03/15',
    }),
    paymentMethod: z.string().openapi({
      description: 'Current payment method',
      example: 'SBPS',
    }),
  })
  .openapi({
    title: 'PaymentSummary',
    description: 'Payment summary card data',
  });

export type PaymentSummary = z.infer<typeof PaymentSummarySchema>;

// ─── Usage History Schemas (A-01-01-e, FR-010) ────────────────────────────

export const EntryMethodSchema = z
  .enum(['qr_code', 'ic_card', 'face_recognition', 'member_card'])
  .openapi({
    title: 'EntryMethod',
    description: 'Member authentication method for entry/exit',
    example: 'qr_code',
  });

export const VisitRowSchema = z
  .object({
    id: z.string().openapi({
      description: 'Visit record ID',
      example: 'vr-001',
    }),
    entry_time: z.string().openapi({
      description: 'Entry time in ISO8601 format',
      example: '2026-04-23T18:00:00Z',
    }),
    exit_time: z.string().nullable().openapi({
      description: 'Exit time in ISO8601 format, or null if still in building',
      example: '2026-04-23T19:30:00Z',
    }),
    stay_time: z.number().optional().openapi({
      description: 'Duration of stay in minutes',
      example: 90,
    }),
    store_id: z.string().openapi({
      description: 'Store ID',
      example: 'store-001',
    }),
    store_name: z.string().openapi({
      description: 'Store name in Japanese',
      example: 'JOYFIT渋谷店',
    }),
    entry_method: z.string().openapi({
      description: 'Authentication method used for entry',
      example: 'qr_code',
    }),
  })
  .openapi({ title: 'VisitRow', description: 'Entry/exit visit record' });

export const LessonReservationRowSchema = z
  .object({
    id: z.string().openapi({
      description: 'Lesson reservation ID',
      example: 'lr-001',
    }),
    lesson_date: z.string().openapi({
      description: 'Lesson date in YYYY-MM-DD format',
      example: '2026-04-23',
    }),
    lesson_name: z.string().openapi({
      description: 'Lesson name in Japanese',
      example: 'ボクシング基礎',
    }),
    instructor_name: z.string().openapi({
      description: 'Instructor name in Japanese',
      example: '田中太郎',
    }),
    status: z.enum(['attended', 'absent', 'cancelled', 'reserved']).openapi({
      description: 'Lesson participation status',
      example: 'attended',
    }),
  })
  .openapi({ title: 'LessonReservationRow', description: 'Lesson reservation record' });

export const MemberAccessSettingsSchema = z
  .object({
    auth_method: z.string().openapi({
      description: 'Primary authentication method label',
      example: 'QRコード',
    }),
    ic_card_number: z.string().nullable().openapi({
      description: 'IC card number, or null if not registered',
      example: 'IC-0001',
    }),
    qr_code: z.string().nullable().openapi({
      description: 'QR code identifier, or null if not registered',
      example: 'QR123456789',
    }),
    gate_stop: z.boolean().openapi({
      description: 'Whether gate-stop is currently active',
      example: false,
    }),
  })
  .openapi({ title: 'MemberAccessSettings', description: 'Member access control settings' });

export const GetUsageHistoryResponseSchema = z
  .object({
    visitRecords: z.array(VisitRowSchema).openapi({
      description: 'Entry/exit visit history records',
    }),
    lessonReservations: z.array(LessonReservationRowSchema).openapi({
      description: 'Lesson reservation history records',
    }),
    memberAccessSettings: MemberAccessSettingsSchema.openapi({
      description: 'Member access control settings',
    }),
  })
  .openapi({
    title: 'GetUsageHistoryResponse',
    description: 'Usage history tab data: visits, lessons, and access settings',
  });

export const GetUsageHistoryEntriesResponseSchema = z
  .object({
    items: z.array(VisitRowSchema).openapi({
      description: 'Paginated entry/exit visit records',
    }),
    total: z.number().int().nonnegative().openapi({
      description: 'Total number of entry/exit records',
      example: 120,
    }),
    page: z.number().int().positive().openapi({
      description: 'Current page number (1-based)',
      example: 1,
    }),
    limit: z.number().int().positive().openapi({
      description: 'Number of records per page',
      example: 50,
    }),
  })
  .openapi({
    title: 'GetUsageHistoryEntriesResponse',
    description: 'Paginated entry/exit history response',
  });

export const GetUsageHistoryLessonsResponseSchema = z
  .object({
    items: z.array(LessonReservationRowSchema).openapi({
      description: 'Paginated lesson reservation records',
    }),
    total: z.number().int().nonnegative().openapi({
      description: 'Total number of lesson reservation records',
      example: 36,
    }),
    page: z.number().int().positive().openapi({
      description: 'Current page number (1-based)',
      example: 1,
    }),
    limit: z.number().int().positive().openapi({
      description: 'Number of records per page',
      example: 20,
    }),
  })
  .openapi({
    title: 'GetUsageHistoryLessonsResponse',
    description: 'Paginated lesson reservations response',
  });

export const GetUsageHistoryAccessSettingsResponseSchema = MemberAccessSettingsSchema.openapi({
  title: 'GetUsageHistoryAccessSettingsResponse',
  description: 'Member access settings for usage history tab',
});

export const UsageHistoryStoreItemSchema = z
  .object({
    id: z.string().openapi({ description: 'Store internal ID', example: 'store-uuid-001' }),
    store_id: z.string().openapi({ description: 'Store display ID', example: 'ST001' }),
    name: z.string().openapi({ description: 'Store name in Japanese', example: 'JOYFIT渋谷店' }),
  })
  .openapi({ title: 'UsageHistoryStoreItem' });

export const GetUsageHistoryStoresResponseSchema = z
  .object({
    stores: z.array(UsageHistoryStoreItemSchema).openapi({
      description: "List of stores for the member's brand",
    }),
  })
  .openapi({
    title: 'GetUsageHistoryStoresResponse',
    description: 'Stores available for usage history filtering',
  });

// ===== Re-Enroll =====

export const ReEnrollRequestSchema = z
  .object({
    re_enroll_month: z.string().openapi({
      example: '2026-06',
      description: 'Re-enrollment month (YYYY-MM)',
    }),
    plan: z.string().openapi({
      example: 'レギュラー会員',
      description: 'Selected membership plan',
    }),
    fee_waived: z.boolean().openapi({
      example: false,
      description: 'Whether the enrollment fee is waived',
    }),
  })
  .openapi({
    title: 'ReEnrollRequest',
    description: 'Re-enroll a withdrawn member',
  });

export const ReEnrollResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    re_enroll_month: z.string(),
    plan: z.string(),
    fee_waived: z.boolean(),
  })
  .openapi({
    title: 'ReEnrollResponse',
    description: 'Result of re-enrollment',
  });

export type ReEnrollRequest = z.infer<typeof ReEnrollRequestSchema>;
export type ReEnrollResponse = z.infer<typeof ReEnrollResponseSchema>;

export const DeletePersonalDataResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    member_id: z.string().openapi({ example: 'M-00001' }),
    message: z.string().openapi({ example: '個人情報を削除しました' }),
  })
  .openapi({
    title: 'DeletePersonalDataResponse',
    description: 'Result of personal data anonymisation',
  });

export type DeletePersonalDataResponse = z.infer<typeof DeletePersonalDataResponseSchema>;

// ===== Withdraw =====

export const WithdrawReasonSchema = z
  .enum([
    'relocation',
    'inconvenient_access',
    'cost',
    'health_reason',
    'cancellation_before_use',
    'other',
  ])
  .openapi({
    title: 'WithdrawReason',
    description: 'Reason for withdrawal',
  });

export const WithdrawRequestSchema = z
  .object({
    scheduled_date: z.string().openapi({
      example: '2026-06-30',
      description: 'Scheduled withdrawal date (YYYY-MM-DD)',
    }),
    reason: WithdrawReasonSchema.openapi({
      example: '転居',
      description: 'Withdrawal reason',
    }),
    reason_detail: z.string().optional().openapi({
      example: '詳細理由',
      description: 'Additional detail when reason is その他',
    }),
    is_proxy: z.boolean().openapi({
      example: false,
      description: 'Whether a staff member is submitting on behalf of the member',
    }),
    proxy_agreed_at: z.string().optional().openapi({
      example: '2026-05-19T03:00:00.000Z',
      description: 'Datetime of agreement (required when is_proxy is true)',
    }),
    proxy_method: z.string().optional().openapi({
      example: '来店',
      description: 'Method of agreement when proxy (来店 / 電話 / メール / LINE)',
    }),
  })
  .openapi({
    title: 'WithdrawRequest',
    description: 'Submit a withdrawal request for a member',
  });

export const WithdrawResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    scheduled_date: z.string(),
    reason: z.string(),
  })
  .openapi({
    title: 'WithdrawResponse',
    description: 'Result of withdrawal request',
  });

export type WithdrawRequest = z.infer<typeof WithdrawRequestSchema>;
export type WithdrawResponse = z.infer<typeof WithdrawResponseSchema>;

export const WithdrawCancelResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
  })
  .openapi({
    title: 'WithdrawCancelResponse',
    description: 'Result of cancelling a pending withdrawal',
  });

export type WithdrawCancelResponse = z.infer<typeof WithdrawCancelResponseSchema>;

// ===== Force Withdraw (強制退会) =====

export const ForceWithdrawRequestSchema = z
  .object({
    reason: z.string().min(1).openapi({
      example: '2ヶ月連続未納のため強制退会',
      description: '強制退会の理由',
    }),
  })
  .openapi({
    title: 'ForceWithdrawRequest',
    description:
      '強制退会リクエスト。会員ステータスをforce_withdrawnに更新し、ブラックリストに自動登録する。',
  });

export const ForceWithdrawResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    blacklist_id: z.string(),
  })
  .openapi({
    title: 'ForceWithdrawResponse',
    description: '強制退会処理結果',
  });

export type ForceWithdrawRequest = z.infer<typeof ForceWithdrawRequestSchema>;
export type ForceWithdrawResponse = z.infer<typeof ForceWithdrawResponseSchema>;

// ===== Gate Stop =====

export const GateStopInfoSchema = z
  .object({
    scope: z.enum(['all_stores', 'own_store_only']).openapi({
      description: 'Gate stop scope',
    }),
    reason: z.enum(['nuisance', 'unpaid', 'fraudulent_use', 'other']).openapi({
      description: 'Reason for gate stop',
    }),
    terminal_message: z.string().optional().openapi({
      description: 'Message displayed on gate terminal',
    }),
    lock_after_message: z.boolean().openapi({
      description: 'Whether entry is denied even after confirming the message',
    }),
    set_at: z.string().openapi({
      example: '2026-03-01T09:30:00.000Z',
      description: 'Datetime the gate stop was set (ISO 8601)',
    }),
    set_by: z.string().openapi({
      example: '管理者A',
      description: 'Name of the staff who set the gate stop',
    }),
  })
  .openapi({ title: 'GateStopInfo', description: 'Current gate stop settings for a member' });

export type GateStopInfo = z.infer<typeof GateStopInfoSchema>;

export const GateStopReasonSchema = z
  .enum(['nuisance', 'unpaid', 'fraudulent_use', 'other'])
  .openapi({
    title: 'GateStopReason',
    description:
      'Reason for gate stop: nuisance=迷惑行為, unpaid=未納金, fraudulent_use=不正利用, other=その他',
  });

export const GateStopScopeSchema = z.enum(['all_stores', 'own_store_only']).openapi({
  title: 'GateStopScope',
  description: 'Scope of gate stop: all_stores=全店舗入館不可, own_store_only=自店舗のみ入館不可',
});

export const GateStopRequestSchema = z
  .object({
    scope: GateStopScopeSchema.openapi({ description: 'Gate stop scope' }),
    reason: GateStopReasonSchema.openapi({ description: 'Reason for gate stop' }),
    terminal_message: z.string().optional().openapi({
      example: 'スタッフにお声がけください',
      description: 'Message to display on gate terminal (optional)',
    }),
    lock_after_message: z.boolean().openapi({
      example: false,
      description: 'Whether to deny entry even after member confirms the message',
    }),
  })
  .openapi({
    title: 'GateStopRequest',
    description: 'Request body for setting gate stop on a member',
  });

export const GateStopResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    scope: GateStopScopeSchema,
    reason: GateStopReasonSchema,
  })
  .openapi({
    title: 'GateStopResponse',
    description: 'Result of gate stop setting',
  });

export type GateStopReason = z.infer<typeof GateStopReasonSchema>;
export type GateStopScope = z.infer<typeof GateStopScopeSchema>;
export type GateStopRequest = z.infer<typeof GateStopRequestSchema>;
export type GateStopResponse = z.infer<typeof GateStopResponseSchema>;

// ===== Gate Stop Release =====

export const GateStopReleaseReasonSchema = z
  .enum(['issue_resolved', 'wrong_setting', 'identity_confirmed', 'other'])
  .openapi({
    title: 'GateStopReleaseReason',
    description:
      'Reason for releasing gate stop: issue_resolved=問題解決済み, wrong_setting=誤設定, identity_confirmed=本人確認完了, other=その他',
  });

export const GateStopReleaseRequestSchema = z
  .object({
    reason: GateStopReleaseReasonSchema.openapi({ description: 'Reason for releasing gate stop' }),
    detail: z.string().optional().openapi({
      example: '未払い金の支払いが完了しました',
      description: 'Additional detail for the release reason (optional)',
    }),
  })
  .openapi({
    title: 'GateStopReleaseRequest',
    description: 'Request body for releasing gate stop on a member',
  });

export const GateStopReleaseResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
  })
  .openapi({
    title: 'GateStopReleaseResponse',
    description: 'Result of gate stop release',
  });

export type GateStopReleaseReason = z.infer<typeof GateStopReleaseReasonSchema>;
export type GateStopReleaseRequest = z.infer<typeof GateStopReleaseRequestSchema>;
export type GateStopReleaseResponse = z.infer<typeof GateStopReleaseResponseSchema>;

// ===== Suspend (休会) =====

export const SuspendRequestSchema = z
  .object({
    start_month: z.string().openapi({
      example: '2026-07',
      description: 'Suspension start month (YYYY-MM)',
    }),
    end_month: z.string().openapi({
      example: '2026-09',
      description: 'Suspension end month (YYYY-MM)',
    }),
    reason: z.string().optional().openapi({
      example: '産前産後のため',
      description: 'Reason for suspension (optional)',
    }),
    is_proxy: z.boolean().openapi({
      example: false,
      description: 'Whether a staff member is submitting on behalf of the member',
    }),
    proxy_agreed_at: z.string().optional().openapi({
      example: '2026-05-21T10:00',
      description: 'Datetime of agreement (required when is_proxy is true)',
    }),
    proxy_method: z.string().optional().openapi({
      example: '来店',
      description: 'Method of agreement when proxy',
    }),
  })
  .openapi({
    title: 'SuspendRequest',
    description: 'Submit a suspension (休会) request for an active member',
  });

export const SuspendResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    start_month: z.string(),
    end_month: z.string(),
  })
  .openapi({
    title: 'SuspendResponse',
    description: 'Result of suspension request',
  });

export type SuspendRequest = z.infer<typeof SuspendRequestSchema>;
export type SuspendResponse = z.infer<typeof SuspendResponseSchema>;

// ===== Suspend Release (休会解除) =====

export const SuspendReleaseRequestSchema = z
  .object({
    resume_month: z.string().openapi({
      example: '2026/07',
      description: 'Month from which billing resumes (YYYY/MM)',
    }),
  })
  .openapi({
    title: 'SuspendReleaseRequest',
    description: 'Release a suspension and specify the month billing resumes',
  });

export const SuspendReleaseResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    resume_month: z.string(),
  })
  .openapi({
    title: 'SuspendReleaseResponse',
    description: 'Result of suspension release',
  });

export type SuspendReleaseRequest = z.infer<typeof SuspendReleaseRequestSchema>;
export type SuspendReleaseResponse = z.infer<typeof SuspendReleaseResponseSchema>;

// ===== Transfer =====

export const TransferRequestBodySchema = z
  .object({
    to_store_id: z.string().openapi({
      example: 'store-002',
      description: '移籍先店舗ID',
    }),
    to_store_name: z.string().openapi({
      example: 'JOYFIT新宿店',
      description: '移籍先店舗名',
    }),
    reason: z.string().optional().openapi({
      example: '転居のため',
      description: '移籍理由（任意）',
    }),
    is_proxy: z.boolean().openapi({
      example: false,
      description: 'スタッフが代理申請するかどうか',
    }),
    proxy_agreed_at: z.string().optional().openapi({
      example: '2026-05-19T10:00',
      description: '合意日時（代理申請時に必須）',
    }),
    proxy_method: z.string().optional().openapi({
      example: '来店',
      description: '合意方法（代理申請時）',
    }),
  })
  .openapi({
    title: 'TransferRequestBody',
    description: '移籍申請リクエスト',
  });

export const TransferResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    transfer_id: z.string(),
    to_store_id: z.string(),
    to_store_name: z.string(),
  })
  .openapi({
    title: 'TransferResponse',
    description: '移籍申請結果',
  });

export type TransferRequestBody = z.infer<typeof TransferRequestBodySchema>;
export type TransferResponse = z.infer<typeof TransferResponseSchema>;

export type VisitRow = z.infer<typeof VisitRowSchema>;
export type LessonReservationRow = z.infer<typeof LessonReservationRowSchema>;
export type MemberAccessSettings = z.infer<typeof MemberAccessSettingsSchema>;
export type GetUsageHistoryResponse = z.infer<typeof GetUsageHistoryResponseSchema>;
export type GetUsageHistoryEntriesResponse = z.infer<typeof GetUsageHistoryEntriesResponseSchema>;
export type GetUsageHistoryLessonsResponse = z.infer<typeof GetUsageHistoryLessonsResponseSchema>;
export type GetUsageHistoryAccessSettingsResponse = z.infer<
  typeof GetUsageHistoryAccessSettingsResponseSchema
>;
export type GetUsageHistoryStoresResponse = z.infer<typeof GetUsageHistoryStoresResponseSchema>;
