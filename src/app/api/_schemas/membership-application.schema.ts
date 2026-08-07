import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Membership Application Status Schema
 */
export const MembershipApplicationStatusSchema = z.enum([
  'pending',
  'review',
  'approved',
  'rejected',
  'cancelled',
]);

/**
 * Risk Reason Schema — kept for detail screen compatibility
 */
export const RiskReasonSchema = z.enum([
  'blacklist_match',
  'duplicate_application',
  'payment_failure',
  'high_risk_score',
  'document_issue',
  'other',
]);

export const MembershipApplicationPaymentMethodSchema = z
  .enum(['credit_card', 'bank_transfer'])
  .openapi({ title: 'MembershipApplicationPaymentMethod', description: 'Payment method' });

export const MembershipApplicationPaymentStatusSchema = z
  .enum(['pending', 'paid', 'failed'])
  .openapi({ title: 'MembershipApplicationPaymentStatus', description: 'Payment status' });

/**
 * Membership Application Schema (list item)
 */
export const MembershipApplicationSchema = z
  .object({
    id: z.string().openapi({
      example: 'APP-2026-0001',
      description: 'Application ID',
    }),
    applicant_name: z.string().openapi({
      example: '山田 太郎',
      description: 'Applicant name',
    }),
    status: MembershipApplicationStatusSchema.openapi({
      example: 'pending',
      description: 'Application status',
    }),
    blacklist_match: z.boolean().openapi({
      example: false,
      description: 'Whether applicant matched blacklist',
    }),
    brand_name: z.string().openapi({
      example: 'FIT365',
      description: 'Brand name',
    }),
    store_name: z.string().openapi({
      example: 'FIT365八潮店',
      description: 'Store name',
    }),
    plan_name: z.string().openapi({
      example: 'レギュラー会員',
      description: 'Plan name',
    }),
    campaign: z.string().openapi({
      example: '春の入会キャンペーン',
      description: 'Campaign name (なし when none)',
    }),
    application_date: z.string().datetime().openapi({
      example: '2026-03-30T09:15:00+09:00',
      description: 'Application date and time',
    }),
    start_date: z.string().date().openapi({
      example: '2026-04-01',
      description: 'Scheduled start date',
    }),
    is_minor: z.boolean().optional().openapi({
      example: false,
      description: 'Whether applicant is a minor',
    }),
    is_proxy: z.boolean().optional().openapi({
      example: false,
      description: 'Whether this is a proxy application',
    }),
  })
  .openapi({
    title: 'MembershipApplication',
    description: 'Membership application list item',
  });

/**
 * Pagination Schema
 */
export const PaginationSchema = z
  .object({
    total: z.number().openapi({
      example: 200,
      description: 'Total number of items',
    }),
    total_pages: z.number().openapi({
      example: 4,
      description: 'Total number of pages',
    }),
    current_page: z.number().openapi({
      example: 1,
      description: 'Current page number',
    }),
    limit: z.number().openapi({
      example: 50,
      description: 'Items per page',
    }),
  })
  .openapi({
    title: 'Pagination',
    description: 'Pagination information',
  });

/**
 * Get Membership Applications Query Params Schema
 */
export const GetMembershipApplicationsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1).openapi({
      example: 1,
      description: 'Page number',
    }),
    limit: z.coerce.number().int().positive().optional().default(50).openapi({
      example: 50,
      description: 'Items per page',
    }),
    status: MembershipApplicationStatusSchema.optional().openapi({
      example: 'pending',
      description: 'Filter by status',
    }),
    brand: z.string().optional().openapi({
      example: 'FIT365',
      description: 'Filter by brand name',
    }),
    store: z.string().optional().openapi({
      example: 'FIT365八潮店',
      description: 'Filter by store name',
    }),
    blacklist: z.enum(['all', 'match', 'no_match']).optional().default('all').openapi({
      example: 'all',
      description: 'Filter by blacklist match',
    }),
    date_from: z.string().optional().openapi({
      example: '2026-03-24',
      description: 'Application date range start (YYYY-MM-DD)',
    }),
    date_to: z.string().optional().openapi({
      example: '2026-03-30',
      description: 'Application date range end (YYYY-MM-DD)',
    }),
    sort_by: z.enum(['application_date']).optional().default('application_date').openapi({
      example: 'application_date',
      description: 'Sort field',
    }),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc').openapi({
      example: 'desc',
      description: 'Sort order',
    }),
    search: z.string().optional().openapi({
      example: '山田',
      description: 'Search query (ID or name)',
    }),
  })
  .openapi({
    title: 'GetMembershipApplicationsQuery',
    description: 'Query parameters for getting membership applications',
  });

/**
 * Get Membership Applications Response Schema
 */
export const GetMembershipApplicationsResponseSchema = z
  .object({
    applications: z.array(MembershipApplicationSchema).openapi({
      description: 'List of membership applications',
    }),
    pagination: PaginationSchema.openapi({
      description: 'Pagination information',
    }),
  })
  .openapi({
    title: 'GetMembershipApplicationsResponse',
    description: 'Response for getting membership applications',
  });

/**
 * Timeline Entry Schema
 */
export const TimelineEntrySchema = z
  .object({
    id: z.string().openapi({ example: 'tl-001', description: 'Entry ID' }),
    kind: z.enum(['system', 'memo']).openapi({ example: 'system', description: 'Entry kind' }),
    date: z.string().openapi({
      example: '2026/03/30 09:15',
      description: 'Date/time string (formatted)',
    }),
    operator: z.string().openapi({ example: '管理者A', description: 'Operator name' }),
    content: z.string().openapi({
      example: '申請受付（アプリ経由）',
      description: 'Entry content',
    }),
  })
  .openapi({ title: 'TimelineEntry', description: 'A single activity timeline entry' });

/**
 * Get Application Detail Response Schema
 */
export const GetApplicationDetailResponseSchema = z
  .object({
    application: MembershipApplicationSchema.extend({
      // Applicant personal info
      applicant_kana: z.string().optional().openapi({
        example: 'ヤマダ タロウ',
        description: 'Applicant name (kana)',
      }),
      birth_date: z.string().optional().openapi({
        example: '1990/01/15',
        description: 'Birth date (formatted)',
      }),
      age: z.number().optional().openapi({ example: 36, description: 'Age' }),
      gender_label: z.string().optional().openapi({ example: '男性', description: 'Gender label' }),
      phone: z.string().optional().openapi({
        example: '090-****-5678',
        description: 'Phone (masked)',
      }),
      phone_real: z.string().optional().openapi({
        example: '090-1234-5678',
        description: 'Phone (real)',
      }),
      email_masked: z.string().optional().openapi({
        example: 'ya***@example.jp',
        description: 'Email (masked)',
      }),
      email_real: z.string().optional().openapi({
        example: 'yamada@example.jp',
        description: 'Email (real)',
      }),
      address: z.string().optional().openapi({
        example: '東京都渋谷区***',
        description: 'Address (masked)',
      }),
      address_real: z.string().optional().openapi({
        example: '東京都渋谷区1-2-3',
        description: 'Address (real)',
      }),
      // Blacklist
      blacklist_conditions: z.array(z.string()).optional().openapi({
        description: 'BL match condition labels',
      }),
      // Contract
      usage_start_date: z.string().optional().openapi({
        example: '2026/04/01',
        description: 'Usage start date (formatted)',
      }),
      monthly_fee: z.number().optional().openapi({
        example: 7700,
        description: 'Monthly fee (yen)',
      }),
      options: z.array(z.string()).optional().openapi({ description: 'Selected options' }),
      // Fee rows
      fee_rows: z
        .array(z.object({ label: z.string(), amount: z.number() }))
        .optional()
        .openapi({ description: 'Fee breakdown rows' }),
      // Payment
      payment_method: z.string().optional().openapi({
        example: 'クレジットカード',
        description: 'Payment method label',
      }),
      card_last4: z.string().optional().openapi({
        example: '1234',
        description: 'Card last 4 digits',
      }),
      // Application meta
      application_source: z.string().optional().openapi({
        example: 'アプリ',
        description: 'Application source',
      }),
      updated_at: z.string().optional().openapi({
        example: '2026/03/30 09:20',
        description: 'Last updated (formatted)',
      }),
      // Minor / proxy
      parental_consent: z.boolean().optional().openapi({
        example: false,
        description: 'Parental consent confirmed',
      }),
      proxy_applicant: z.string().optional().openapi({
        example: '管理者A（STAFF-001）',
        description: 'Proxy applicant name',
      }),
      agreement_date: z.string().optional().openapi({
        example: '2026/03/30 09:00',
        description: 'Agreement date (formatted)',
      }),
      // Status feedback
      approved_by: z.string().optional().openapi({
        example: '管理者A',
        description: 'Approver name',
      }),
      approved_at: z.string().optional().openapi({
        example: '2026/03/30 10:30',
        description: 'Approval date (formatted)',
      }),
      rejected_by: z.string().optional().openapi({
        example: '管理者B',
        description: 'Rejector name',
      }),
      rejected_at: z.string().optional().openapi({
        example: '2026/03/30 10:45',
        description: 'Rejection date (formatted)',
      }),
      rejected_reason: z.string().optional().openapi({
        example: '本人確認不備',
        description: 'Rejection reason',
      }),
      // Timeline
      timeline: z.array(TimelineEntrySchema).optional().openapi({
        description: 'Activity timeline',
      }),
    }).openapi({
      description: 'Application detail information',
    }),
  })
  .openapi({
    title: 'GetApplicationDetailResponse',
    description: 'Response for getting application detail',
  });

/**
 * Update Membership Application Request Schema (Edit screen)
 */
export const UpdateMembershipApplicationRequestSchema = z
  .object({
    basic: z
      .object({
        applicant_name: z.string().min(1).optional().openapi({
          example: '山田太郎',
          description: 'Applicant name',
        }),
        gender: z.enum(['male', 'female', 'other', 'unknown']).optional().openapi({
          example: 'male',
          description: 'Gender',
        }),
        blood_type: z.enum(['A', 'B', 'O', 'AB', 'unknown']).optional().openapi({
          example: 'A',
          description: 'Blood type',
        }),
        birthday: z.string().date().optional().openapi({
          example: '2000-01-01',
          description: 'Birthday (YYYY-MM-DD)',
        }),
      })
      .optional()
      .openapi({ description: 'Basic info' }),
    contact: z
      .object({
        applicant_address: z.string().optional().openapi({
          example: '東京都渋谷区1-2-3',
          description: 'Address',
        }),
        applicant_phone: z.string().optional().openapi({
          example: '090-1234-5678',
          description: 'Phone',
        }),
        applicant_email: z.string().email().optional().openapi({
          example: 'yamada.taro@example.com',
          description: 'Email',
        }),
        emergency_contact_name: z.string().optional().openapi({
          example: '佐藤 太郎',
          description: 'Emergency contact name',
        }),
        emergency_contact_relationship: z.string().optional().openapi({
          example: '配偶者',
          description: 'Emergency contact relationship',
        }),
        emergency_contact_phone: z.string().optional().openapi({
          example: '090-8765-4321',
          description: 'Emergency contact phone',
        }),
      })
      .optional()
      .openapi({ description: 'Contact info' }),
    contract: z
      .object({
        start_date: z.string().date().optional().openapi({
          example: '2024-01-20',
          description: 'Scheduled start date (YYYY-MM-DD)',
        }),
        plan_id: z.string().optional().openapi({
          example: 'plan-001',
          description: 'Plan ID',
        }),
        plan_name: z.string().optional().openapi({
          example: '通常会員',
          description: 'Plan name',
        }),
        option_ids: z
          .array(z.string())
          .optional()
          .openapi({
            example: ['opt-001', 'opt-002'],
            description: 'Option IDs',
          }),
        recalculate_fee: z.boolean().optional().openapi({
          example: false,
          description: 'Whether to recalculate fee',
        }),
      })
      .optional()
      .openapi({ description: 'Contract info' }),
  })
  .openapi({
    title: 'UpdateMembershipApplicationRequest',
    description: 'Request payload for editing membership application',
  });

/**
 * Update Membership Application Response Schema
 */
export const UpdateMembershipApplicationResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: 'Whether the operation was successful',
    }),
    application: z.record(z.string(), z.any()).openapi({
      description: 'Updated application (shape follows detail response)',
    }),
  })
  .openapi({
    title: 'UpdateMembershipApplicationResponse',
    description: 'Response for editing membership application',
  });

/**
 * Approve Request Schema
 */
export const ApproveRequestSchema = z
  .object({
    approval_reason: z.string().optional().openapi({
      example: '手動承認',
      description: 'Approval reason',
    }),
    staff_id: z.string().optional().openapi({
      example: 'staff-001',
      description: 'Staff ID who approved',
    }),
  })
  .openapi({
    title: 'ApproveRequest',
    description: 'Request payload for approving an application',
  });

/**
 * Approve Response Schema
 */
export const ApproveResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: 'Whether the operation was successful',
    }),
    application_id: z.string().openapi({
      example: 'APP-00001',
      description: 'Application ID',
    }),
    status: z.enum(['approved']).openapi({
      example: 'approved',
      description: 'New application status',
    }),
    approved_at: z.string().datetime().openapi({
      example: '2024-01-15T12:30:00Z',
      description: 'Approval date and time',
    }),
    approved_by: z.string().openapi({
      example: 'staff-001',
      description: 'Staff ID who approved',
    }),
    approval_reason: z.string().openapi({
      example: '手動承認',
      description: 'Approval reason',
    }),
    member_id: z.string().openapi({
      example: 'MEMBER-00001',
      description: 'Member ID',
    }),
  })
  .openapi({
    title: 'ApproveResponse',
    description: 'Response for approving an application',
  });

/**
 * Reject Request Schema
 */
export const RejectRequestSchema = z
  .object({
    rejection_reason: z.string().min(1, 'Rejection reason is required').openapi({
      example: 'リスクスコアが高すぎます',
      description: 'Rejection reason',
    }),
    note: z.string().optional().openapi({
      example: '本人確認書類の有効期限切れを確認。',
      description: 'Optional supplementary note',
    }),
    staff_id: z.string().optional().openapi({
      example: 'staff-001',
      description: 'Staff ID who rejected',
    }),
  })
  .openapi({
    title: 'RejectRequest',
    description: 'Request payload for rejecting an application',
  });

/**
 * Reject Response Schema
 */
export const RejectResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: 'Whether the operation was successful',
    }),
    application_id: z.string().openapi({
      example: 'APP-00001',
      description: 'Application ID',
    }),
    status: z.enum(['rejected']).openapi({
      example: 'rejected',
      description: 'New application status',
    }),
    rejected_at: z.string().datetime().openapi({
      example: '2024-01-15T12:30:00Z',
      description: 'Rejection date and time',
    }),
    rejected_by: z.string().openapi({
      example: 'staff-001',
      description: 'Staff ID who rejected',
    }),
    rejection_reason: z.string().openapi({
      example: 'リスクスコアが高すぎます',
      description: 'Rejection reason',
    }),
  })
  .openapi({
    title: 'RejectResponse',
    description: 'Response for rejecting an application',
  });

/**
 * Cancel Request Schema
 */
export const CancelRequestSchema = z
  .object({
    cancellation_reason: z.string().min(1, 'Cancellation reason is required').openapi({
      example: '顧客の要望によりキャンセル',
      description: 'Cancellation reason',
    }),
    staff_id: z.string().optional().openapi({
      example: 'staff-001',
      description: 'Staff ID who cancelled',
    }),
  })
  .openapi({
    title: 'CancelRequest',
    description: 'Request payload for cancelling an application',
  });

/**
 * Cancel Response Schema
 */
export const CancelResponseSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
      description: 'Whether the operation was successful',
    }),
    application_id: z.string().openapi({
      example: 'APP-00001',
      description: 'Application ID',
    }),
    status: z.enum(['cancelled']).openapi({
      example: 'cancelled',
      description: 'New application status',
    }),
    cancelled_at: z.string().datetime().openapi({
      example: '2024-01-15T12:30:00Z',
      description: 'Cancellation date and time',
    }),
    cancelled_by: z.string().openapi({
      example: 'staff-001',
      description: 'Staff ID who cancelled',
    }),
    cancellation_reason: z.string().openapi({
      example: '顧客の要望によりキャンセル',
      description: 'Cancellation reason',
    }),
    refund_processed: z.boolean().openapi({
      example: true,
      description: 'Whether refund was processed',
    }),
    refund_amount: z.number().openapi({
      example: 5000,
      description: 'Refund amount',
    }),
  })
  .openapi({
    title: 'CancelResponse',
    description: 'Response for cancelling an application',
  });

/**
 * Memo Schema
 */
export const MemoSchema = z
  .object({
    id: z.string().openapi({
      example: 'tl-1234567890-memo',
      description: 'Memo ID',
    }),
    kind: z.enum(['memo']).openapi({
      example: 'memo',
      description: 'Entry type',
    }),
    date: z.string().openapi({
      example: '2026/03/30 09:15',
      description: 'Memo date and time',
    }),
    operator: z.string().openapi({
      example: '管理者A',
      description: 'Staff member who added the memo',
    }),
    content: z.string().openapi({
      example: 'メモのコンテンツ',
      description: 'Memo content',
    }),
  })
  .openapi({
    title: 'Memo',
    description: 'Memo entry in timeline',
  });

/**
 * Create Memo Request Schema
 */
export const CreateMemoRequestSchema = z
  .object({
    content: z.string().min(1).openapi({
      example: 'メモのコンテンツ',
      description: 'Memo content',
    }),
  })
  .openapi({
    title: 'CreateMemoRequest',
    description: 'Request to create a memo for membership application',
  });

/**
 * Create Memo Response Schema
 */
export const CreateMemoResponseSchema = z
  .object({
    id: z.string().openapi({
      example: 'tl-1234567890-memo',
      description: 'Created memo ID',
    }),
    kind: z.enum(['memo']).openapi({
      example: 'memo',
      description: 'Entry type',
    }),
    date: z.string().openapi({
      example: '2026/03/30 09:15',
      description: 'Memo date and time',
    }),
    operator: z.string().openapi({
      example: '管理者A',
      description: 'Staff member who added the memo',
    }),
    content: z.string().openapi({
      example: 'メモのコンテンツ',
      description: 'Memo content',
    }),
  })
  .openapi({
    title: 'CreateMemoResponse',
    description: 'Response for creating a memo',
  });

/**
 * Error Response Schema (re-exported from auth.schema.ts for consistency)
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
export type MembershipApplicationStatus = z.infer<typeof MembershipApplicationStatusSchema>;
export type RiskReason = z.infer<typeof RiskReasonSchema>;
export type MembershipApplication = z.infer<typeof MembershipApplicationSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type GetMembershipApplicationsQuery = z.infer<typeof GetMembershipApplicationsQuerySchema>;
export type GetMembershipApplicationsResponse = z.infer<
  typeof GetMembershipApplicationsResponseSchema
>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type GetApplicationDetailResponse = z.infer<typeof GetApplicationDetailResponseSchema>;
export type UpdateMembershipApplicationRequest = z.infer<
  typeof UpdateMembershipApplicationRequestSchema
>;
export type UpdateMembershipApplicationResponse = z.infer<
  typeof UpdateMembershipApplicationResponseSchema
>;
export type ApproveRequest = z.infer<typeof ApproveRequestSchema>;
export type ApproveResponse = z.infer<typeof ApproveResponseSchema>;
export type RejectRequest = z.infer<typeof RejectRequestSchema>;
export type RejectResponse = z.infer<typeof RejectResponseSchema>;
export type CancelRequest = z.infer<typeof CancelRequestSchema>;
export type CancelResponse = z.infer<typeof CancelResponseSchema>;
export type Memo = z.infer<typeof MemoSchema>;
export type CreateMemoRequest = z.infer<typeof CreateMemoRequestSchema>;
export type CreateMemoResponse = z.infer<typeof CreateMemoResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ─── T-001: Enrollment Fee Master + Upload Response ───────────────────────────

/**
 * Enrollment Fee Master Schema
 */
export const EnrollmentFeeMasterSchema = z
  .object({
    id: z.string().openapi({ example: 'EF001', description: 'Fee master ID' }),
    name: z.string().openapi({ example: '標準入会金', description: 'Fee name' }),
    amount: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 2200, description: 'Fee amount (JPY, tax-included)' }),
    brand: z.string().openapi({ example: 'JOYFIT', description: 'Brand (JOYFIT / FIT365 / 共通)' }),
    application_type: z.string().openapi({ example: 'normal', description: 'Application type' }),
    isActive: z.boolean().openapi({ example: true, description: 'Whether this master is active' }),
  })
  .openapi({ title: 'EnrollmentFeeMaster', description: 'Enrollment fee master record' });

export const GetEnrollmentFeeMastersQuerySchema = z.object({
  brand: z.string().optional().openapi({ example: 'JOYFIT', description: 'Filter by brand' }),
  applicationType: z
    .string()
    .optional()
    .openapi({ example: 'normal', description: 'Filter by application type' }),
});

export const GetEnrollmentFeeMastersResponseSchema = z
  .object({
    items: z.array(EnrollmentFeeMasterSchema),
  })
  .openapi({
    title: 'GetEnrollmentFeeMastersResponse',
    description: 'List of enrollment fee masters',
  });

/**
 * Upload Response Schema
 */
export const UploadResponseSchema = z
  .object({
    url: z.string().url().openapi({
      example: 'https://cdn.mock.example.com/uploads/abc123.jpg',
      description: 'Uploaded file URL',
    }),
  })
  .openapi({ title: 'UploadResponse', description: 'Upload response with file URL' });

// Type exports (T-001)
export type EnrollmentFeeMaster = z.infer<typeof EnrollmentFeeMasterSchema>;
export type GetEnrollmentFeeMastersQuery = z.infer<typeof GetEnrollmentFeeMastersQuerySchema>;
export type GetEnrollmentFeeMastersResponse = z.infer<typeof GetEnrollmentFeeMastersResponseSchema>;
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

// ─── T-002: BL Check + Direct Enrollment Schemas ─────────────────────────────

/**
 * Application Type
 */
export const ApplicationTypeSchema = z
  .enum(['normal', 'employee_discount', 'corporate', 'special_contract'])
  .openapi({ title: 'ApplicationType', description: 'Enrollment application type' });

export type ApplicationType = z.infer<typeof ApplicationTypeSchema>;

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  normal: '通常入会',
  employee_discount: '社員割引入会',
  corporate: '法人会員入会',
  special_contract: '特別契約入会',
};

/**
 * Blacklist Check Request / Response
 */
export const BlacklistCheckRequestSchema = z
  .object({
    last_name_kanji: z.string().min(1).max(255).openapi({ example: '山田' }),
    first_name_kanji: z.string().min(1).max(255).openapi({ example: '太郎' }),
    last_name_kana: z.string().min(1).max(255).openapi({ example: 'ヤマダ' }),
    first_name_kana: z.string().min(1).max(255).openapi({ example: 'タロウ' }),
    date_of_birth: z.string().date().openapi({ example: '1990-01-01' }),
    gender: z.enum(['male', 'female', 'other']).openapi({ example: 'male' }),
    phone: z.string().min(1).max(255).openapi({ example: '090-1234-5678' }),
    email: z.string().email().max(255).openapi({ example: 'taro@example.com' }),
    address: z.string().max(1000).optional().openapi({ example: '東京都渋谷区1-1-1' }),
  })
  .openapi({ title: 'BlacklistCheckRequest', description: 'Blacklist check request' });

export const BlacklistCheckResponseSchema = z
  .object({
    checked: z.boolean().openapi({ example: true }),
    matched: z.boolean().openapi({ example: false }),
  })
  .openapi({ title: 'BlacklistCheckResponse', description: 'Blacklist check result' });

/**
 * Direct Enrollment — Applicant
 */
export const DirectEnrollmentApplicantSchema = z
  .object({
    last_name_kanji: z.string().min(1, { message: '姓を入力してください' }).max(255),
    first_name_kanji: z.string().min(1, { message: '名を入力してください' }).max(255),
    last_name_kana: z
      .string()
      .min(1, { message: '姓（カナ）を入力してください' })
      .max(255)
      .regex(/^[\u30A0-\u30FF\s]+$/, 'カタカナで入力してください'),
    first_name_kana: z
      .string()
      .min(1, { message: '名（カナ）を入力してください' })
      .max(255)
      .regex(/^[\u30A0-\u30FF\s]+$/, 'カタカナで入力してください'),
    date_of_birth: z.string().min(1, { message: '生年月日を入力してください' }).date(),
    gender: z.enum(['male', 'female', 'other']),
    phone: z.string().min(1, { message: '電話番号を入力してください' }).max(255),
    email: z
      .string()
      .min(1, { message: 'メールアドレスを入力してください' })
      .email({ message: '有効なメールアドレスを入力してください' })
      .max(255),
    address: z.string().max(1000).optional(),
    face_photo_url: z
      .string()
      .min(1, { message: '顔写真をアップロードしてください' })
      .url({ message: '有効なURLを入力してください' }),
  })
  .openapi({ title: 'DirectEnrollmentApplicant' });

/**
 * Direct Enrollment — Contract
 */
export const DirectEnrollmentContractSchema = z
  .object({
    brand: z.enum(['FIT365', 'JOYFIT']),
    store_id: z.string().min(1, { message: '店舗を選択してください' }),
    plan_id: z.string().min(1, { message: 'プランを選択してください' }),
    start_date: z.string().min(1, { message: '利用開始日を入力してください' }).date(),
    campaign_id: z.string().optional(),
    payment_method: z.enum(['credit_card', 'bank_transfer']),
  })
  .openapi({ title: 'DirectEnrollmentContract' });

/**
 * Direct Enrollment — Corporate
 */
export const DirectEnrollmentCorporateSchema = z
  .object({
    corporate_id: z.string().min(1, { message: '法人を選択してください' }),
    billing_pattern: z.string().min(1, { message: '請求パターンを入力してください' }),
    enrollment_fee_bearer: z.string().min(1, { message: '入会金負担者を選択してください' }),
  })
  .openapi({ title: 'DirectEnrollmentCorporate' });

/**
 * Direct Enrollment — Employee Discount
 */
export const DirectEnrollmentEmployeeDiscountSchema = z
  .object({
    partner_company_id: z.string().min(1, { message: '提携会社を選択してください' }),
    employee_number: z.string().min(1, { message: '社員番号を入力してください' }).max(255),
    employee_id_verified: z.literal(true),
    employment_cert_verified: z.literal(true),
    employee_id_image_url: z.string().url().optional(),
    employment_cert_image_url: z.string().url().optional(),
  })
  .openapi({ title: 'DirectEnrollmentEmployeeDiscount' });

/**
 * Direct Enrollment — Fees
 */
export const DirectEnrollmentFeesSchema = z
  .object({
    // JOYFIT fields
    enrollment_fee_master_id: z.string().optional(),
    enrollment_fee_amount: z.number().int().nonnegative().optional(),
    registration_fee: z.number().int().nonnegative().optional(),
    // FIT365 fields
    card_issuance_fee: z.number().int().nonnegative().optional(),
    // Shared
    first_month_fee_prorated: z.number().int().nonnegative().optional(),
    next_month_fee: z.number().int().nonnegative().optional(),
  })
  .openapi({ title: 'DirectEnrollmentFees' });

/**
 * Direct Enrollment Request Base (no superRefine — applied in form)
 */
export const DirectEnrollmentRequestBaseSchema = z
  .object({
    application_type: ApplicationTypeSchema,
    applicant: DirectEnrollmentApplicantSchema,
    contract: DirectEnrollmentContractSchema,
    corporate: DirectEnrollmentCorporateSchema.optional(),
    employee_discount: DirectEnrollmentEmployeeDiscountSchema.optional(),
    fees: DirectEnrollmentFeesSchema,
  })
  .openapi({ title: 'DirectEnrollmentRequest', description: 'Direct enrollment request body' });

/**
 * Direct Enrollment Response
 */
export const DirectEnrollmentResponseSchema = z
  .object({
    applicationId: z.string().openapi({ example: 'APP-DIRECT-1234567890' }),
    memberId: z.string().openapi({ example: 'MBR-DIRECT-1234567890' }),
    status: z.literal('pending'),
  })
  .openapi({ title: 'DirectEnrollmentResponse', description: 'Direct enrollment response' });

// Type exports (T-002)
export type BlacklistCheckRequest = z.infer<typeof BlacklistCheckRequestSchema>;
export type BlacklistCheckResponse = z.infer<typeof BlacklistCheckResponseSchema>;
export type DirectEnrollmentApplicant = z.infer<typeof DirectEnrollmentApplicantSchema>;
export type DirectEnrollmentContract = z.infer<typeof DirectEnrollmentContractSchema>;
export type DirectEnrollmentCorporate = z.infer<typeof DirectEnrollmentCorporateSchema>;
export type DirectEnrollmentEmployeeDiscount = z.infer<
  typeof DirectEnrollmentEmployeeDiscountSchema
>;
export type DirectEnrollmentFees = z.infer<typeof DirectEnrollmentFeesSchema>;
export type DirectEnrollmentRequest = z.infer<typeof DirectEnrollmentRequestBaseSchema>;
export type DirectEnrollmentResponse = z.infer<typeof DirectEnrollmentResponseSchema>;
