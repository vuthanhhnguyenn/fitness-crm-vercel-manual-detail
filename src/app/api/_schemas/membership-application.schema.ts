import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// ─── Enumerations (C-01 revision 260624_v5) ──────────────────────────────────

/**
 * Membership Application Status — six values in v5.
 * `auto_approved` is decided upstream of the CRM on receipt; the CRM never
 * transitions an application into it, it only renders such records read-only.
 */
export const MembershipApplicationStatusSchema = z
  .enum(['pending', 'review', 'approved', 'auto_approved', 'rejected', 'cancelled'])
  .openapi({ title: 'MembershipApplicationStatus', description: 'Application status' });

/**
 * Enrollment Route (入会経路) — new in v5, replaces the 申請種別 axis.
 * Tracked independently of whether a campaign was applied.
 */
export const EnrollmentRouteSchema = z
  .enum(['mobile', 'manual', 'referral'])
  .openapi({ title: 'EnrollmentRoute', description: 'How the application arrived' });

/** Rejection Reason — a closed set of exactly four values (FR-031). */
export const RejectionReasonSchema = z
  .enum(['identity_incomplete', 'age_restriction', 'blacklist_match', 'other'])
  .openapi({ title: 'RejectionReason', description: 'Standard rejection reason' });

/**
 * Blacklist comparison state. `incomplete` covers the case where the comparison
 * could not run — the pre-approval checklist must not report it as passed.
 */
export const BlacklistCheckStateSchema = z
  .enum(['not_checked', 'no_match', 'matched', 'incomplete'])
  .openapi({ title: 'BlacklistCheckState', description: 'Blacklist comparison state' });

/**
 * ⚠️ PROVISIONAL — enrolment-fee exemption kind (FR-025 / FR-026 / FR-025a).
 * Reproduced from the V0 prototype, absent from C-01 revision 260624_v5,
 * pending PO confirmation. See the precedence comment in
 * `_mock-db/tables/membership-application.table.ts`.
 */
export const EnrollmentFeeExemptionKindSchema = z
  .enum(['campaign', 'rejoin', 'staff', 'none'])
  .openapi({ title: 'EnrollmentFeeExemptionKind', description: 'Which exemption applied' });

export const MembershipApplicationPaymentMethodSchema = z
  .enum(['credit_card', 'bank_transfer'])
  .openapi({ title: 'MembershipApplicationPaymentMethod', description: 'Payment method' });

export const MembershipApplicationPaymentStatusSchema = z
  .enum(['pending', 'paid', 'failed'])
  .openapi({ title: 'MembershipApplicationPaymentStatus', description: 'Payment status' });

// ─── List item ────────────────────────────────────────────────────────────────

/**
 * Membership Application Schema (list item)
 */
export const MembershipApplicationSchema = z
  .object({
    id: z.string().openapi({ example: 'APP-2026-0001', description: 'Application ID' }),
    applicant_name: z.string().openapi({ example: '山田 太郎', description: 'Applicant name' }),
    status: MembershipApplicationStatusSchema.openapi({ example: 'pending' }),
    enrollment_route: EnrollmentRouteSchema.openapi({ example: 'mobile' }),
    blacklist_state: BlacklistCheckStateSchema.openapi({ example: 'no_match' }),
    brand_id: z.string().openapi({ example: 'BRD-002', description: 'Brand ID' }),
    brand_name: z.string().openapi({ example: 'FIT365', description: 'Brand name' }),
    store_id: z.string().openapi({ example: 'STR-011', description: 'Store ID' }),
    store_name: z.string().openapi({ example: 'FIT365八潮店', description: 'Store name' }),
    plan_name: z.string().openapi({ example: 'レギュラー会員', description: 'Plan name' }),
    campaign_name: z.string().nullable().openapi({
      example: '春の入会キャンペーン',
      description: 'Applied campaign name — null when none applies',
    }),
    application_date: z.string().openapi({
      example: '2026-03-30T09:15:00+09:00',
      description: 'Application date and time (ISO 8601)',
    }),
    usage_start_date: z.string().openapi({
      example: '2026-04-01',
      description: 'Usage start date (YYYY-MM-DD)',
    }),
    is_minor: z.boolean().openapi({
      example: false,
      description: 'Whether the applicant is a minor',
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
    total: z.number().openapi({ example: 47, description: 'Total number of items' }),
    total_pages: z.number().openapi({ example: 1, description: 'Total number of pages' }),
    current_page: z.number().openapi({ example: 1, description: 'Current page number' }),
    limit: z.number().openapi({ example: 50, description: 'Items per page' }),
  })
  .openapi({ title: 'Pagination', description: 'Pagination information' });

/**
 * KPI summary — computed over the caller's whole store scope, before pagination
 * and before the user's filters (FR-004, research R3). A paginated client cannot
 * compute these from what it receives.
 */
export const MembershipApplicationSummarySchema = z
  .object({
    pending_count: z.number().openapi({
      example: 12,
      description: 'Applications in the queue (status pending or review) within scope',
    }),
    blacklist_count: z.number().openapi({
      example: 3,
      description: 'That same set where blacklist_state is matched',
    }),
  })
  .openapi({
    title: 'MembershipApplicationSummary',
    description: 'Scope-wide KPI counts for the review queue',
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
    limit: z.coerce
      .number()
      .int()
      .refine((n) => n === 25 || n === 50 || n === 100 || n === 200, {
        message: 'limit must be one of 25, 50, 100, 200',
      })
      .optional()
      .default(50)
      .openapi({ example: 50, description: 'Items per page (25 | 50 | 100 | 200)' }),
    status: MembershipApplicationStatusSchema.optional().openapi({
      example: 'pending',
      description: 'Filter by status',
    }),
    route: EnrollmentRouteSchema.optional().openapi({
      example: 'mobile',
      description: 'Filter by enrollment route',
    }),
    brand: z.string().optional().openapi({
      example: 'BRD-002',
      description: 'Filter by brand ID — can only narrow within the caller scope',
    }),
    store: z.string().optional().openapi({
      example: 'STR-011',
      description: 'Filter by store ID — ignored when the caller is single-store scoped',
    }),
    blacklist: z.enum(['all', 'match', 'no_match']).optional().default('all').openapi({
      example: 'all',
      description: 'Filter by blacklist comparison result',
    }),
    date_from: z.string().optional().openapi({
      example: '2026-03-24',
      description: 'Application date range start (YYYY-MM-DD)',
    }),
    date_to: z.string().optional().openapi({
      example: '2026-03-30',
      description: 'Application date range end (YYYY-MM-DD)',
    }),
    sort_by: z
      .enum(['id', 'applicant_name', 'status', 'application_date', 'usage_start_date'])
      .optional()
      .default('application_date')
      .openapi({ example: 'application_date', description: 'Sort field' }),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc').openapi({
      example: 'desc',
      description: 'Sort order',
    }),
    search: z.string().optional().openapi({
      example: '山田',
      description: 'Partial match on application ID or applicant name',
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
    pagination: PaginationSchema.openapi({ description: 'Pagination information' }),
    summary: MembershipApplicationSummarySchema.openapi({
      description: 'Scope-wide KPI counts, independent of filters and pagination',
    }),
    unfiltered_total: z.number().openapi({
      example: 128,
      description: 'Scoped row count before the user filters — powers the result banner',
    }),
  })
  .openapi({
    title: 'GetMembershipApplicationsResponse',
    description: 'Response for getting membership applications',
  });

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Timeline Entry Schema
 */
export const TimelineEntrySchema = z
  .object({
    id: z.string().openapi({ example: 'tl-001', description: 'Entry ID' }),
    kind: z.enum(['system', 'memo']).openapi({ example: 'system', description: 'Entry kind' }),
    datetime: z.string().openapi({
      example: '2026-03-30T09:15:00+09:00',
      description: 'Entry date and time (ISO 8601)',
    }),
    operator: z.string().openapi({ example: '管理者A', description: 'Operator name' }),
    content: z.string().openapi({
      example: '申請受付（アプリ経由）',
      description: 'Entry content',
    }),
  })
  .openapi({ title: 'TimelineEntry', description: 'A single activity timeline entry' });

/** One matched blacklist condition, linked to the entry it matched (FR-020). */
export const BlacklistConditionSchema = z
  .object({
    condition: z
      .enum(['name_birthdate', 'email', 'phone', 'address'])
      .openapi({ example: 'name_birthdate' }),
    label: z.string().openapi({ example: '氏名＋生年月日' }),
    blacklist_entry_id: z.string().openapi({ example: 'BL-0007' }),
  })
  .openapi({ title: 'BlacklistCondition', description: 'A matched blacklist condition' });

/** One line of the initial-charge breakdown (FR-023). */
export const FeeRowSchema = z
  .object({
    key: z.string().openapi({ example: 'enrollment_fee', description: 'Stable row key' }),
    label: z.string().openapi({ example: '入会金' }),
    amount: z.number().openapi({ example: 2200 }),
    struck_through: z.boolean().optional().openapi({
      example: true,
      description: 'Whether the original amount is superseded by an exemption',
    }),
  })
  .openapi({ title: 'FeeRow', description: 'A single fee breakdown row' });

/**
 * ⚠️ PROVISIONAL enrolment-fee exemption block (FR-025 / FR-026 / FR-025a).
 *
 * This block has NO counterpart in C-01 revision 260624_v5. It is reproduced
 * from the V0 prototype and is pending PO confirmation. It is declared
 * `.optional()` on the response so a Phase-2 backend that omits it stays
 * contract-valid; the client treats a missing value as "no exemption".
 */
export const EnrollmentFeeExemptionSchema = z
  .object({
    kind: EnrollmentFeeExemptionKindSchema.openapi({ example: 'rejoin' }),
    original_amount: z.number().openapi({ example: 2200 }),
    discount_amount: z.number().openapi({ example: 2200 }),
    reason: z.string().nullable().openapi({
      example: null,
      description: 'Mandatory before a staff-discretionary exemption takes effect',
    }),
    rule_label: z.string().nullable().openapi({ example: '退会から180日以内の再入会' }),
    previous_withdrawal_date: z.string().nullable().openapi({ example: '2026-01-20' }),
    qualifies: z.boolean().openapi({ example: true }),
    campaign_name: z.string().nullable().openapi({ example: null }),
    rejoin_window_days: z.number().openapi({
      example: 180,
      description: 'The re-enrolment window this determination used',
    }),
  })
  .openapi({
    title: 'EnrollmentFeeExemption',
    description: 'PROVISIONAL enrolment-fee exemption determination',
  });

/** Companion (C区分) → regular member (A区分) upgrade preview (FR-041). */
export const CompanionUpgradeSchema = z
  .object({
    yamauchi_id: z.string().openapi({ example: 'YM-00012345' }),
    from_classification: z.string().openapi({ example: 'C' }),
    to_classification: z.string().openapi({ example: 'A' }),
    inherited_visit_count: z.number().openapi({ example: 8 }),
    inherited_training_count: z.number().openapi({ example: 3 }),
  })
  .openapi({ title: 'CompanionUpgrade', description: 'Companion-to-member upgrade summary' });

/**
 * Get Application Detail Response Schema
 */
export const GetApplicationDetailResponseSchema = z
  .object({
    application: MembershipApplicationSchema.extend({
      // ── Applicant (FR-018, FR-019) ──
      applicant_kana: z.string().openapi({ example: 'ヤマダ タロウ' }),
      birth_date: z.string().openapi({ example: '1990-01-15' }),
      age: z.number().openapi({ example: 36 }),
      gender_label: z.string().openapi({ example: '男性' }),
      phone_masked: z.string().openapi({ example: '090-****-5678' }),
      phone_real: z.string().openapi({ example: '090-1234-5678' }),
      email_masked: z.string().openapi({ example: 'ya***@example.jp' }),
      email_real: z.string().openapi({ example: 'yamada@example.jp' }),
      address_masked: z.string().openapi({ example: '東京都渋谷区***' }),
      address_real: z.string().openapi({ example: '東京都渋谷区1-2-3' }),
      face_photo_registered: z.boolean().openapi({ example: true }),
      face_photo_registered_at: z.string().nullable().openapi({
        example: '2026-03-30T09:10:00+09:00',
      }),

      // ── Blacklist (FR-020, FR-021) ──
      blacklist_conditions: z.array(BlacklistConditionSchema).openapi({
        description: 'Matched conditions — empty unless blacklist_state is matched',
      }),

      // ── Contract (FR-022) ──
      plan_id: z.string().openapi({ example: 'PLN-010' }),
      monthly_fee: z.number().openapi({ example: 7700 }),
      prepayment_months: z.number().openapi({ example: 2 }),
      prepayment_rule_label: z.string().openapi({ example: 'FIT365: 2ヶ月固定' }),
      options: z.array(z.string()).openapi({ example: ['タオルレンタル'] }),
      payment_method: MembershipApplicationPaymentMethodSchema.openapi({
        example: 'bank_transfer',
      }),
      card_last4: z.string().nullable().openapi({ example: null }),
      contract_start_date: z.string().openapi({ example: '2026-04-01' }),

      // ── Fees (FR-023, FR-024) ──
      fee_rows: z.array(FeeRowSchema).openapi({ description: 'Initial charge breakdown' }),
      fee_total: z.number().openapi({ example: 15620 }),

      // ── ⚠️ PROVISIONAL exemption (FR-025, FR-026, FR-025a) ──
      enrollment_fee_exemption: EnrollmentFeeExemptionSchema.optional().openapi({
        description:
          'PROVISIONAL — absent from C-01 260624_v5. Populated only while the application is 未審査.',
      }),

      // ── Pre-approval checklist inputs (FR-027) ──
      brand_min_age: z.number().openapi({ example: 16 }),
      parental_consent: z.boolean().openapi({ example: false }),
      parental_consent_at: z.string().nullable().openapi({ example: null }),
      parental_consent_method: z.string().nullable().openapi({ example: null }),

      // ── Application meta (FR-039, FR-028) ──
      application_source: z.string().openapi({ example: 'アプリ' }),
      proxy_staff_name: z.string().nullable().openapi({ example: null }),
      proxy_staff_id: z.string().nullable().openapi({ example: null }),
      agreement_datetime: z.string().nullable().openapi({ example: null }),
      updated_at: z.string().openapi({ example: '2026-03-30T09:20:00+09:00' }),

      // ── Companion upgrade (FR-041) ──
      companion_upgrade: CompanionUpgradeSchema.nullable().openapi({
        description:
          'Present when approval upgrades an existing Yamauchi-ID rather than creating one',
      }),

      // ── Decision record (FR-040) ──
      approved_by: z.string().nullable().openapi({ example: null }),
      approved_at: z.string().nullable().openapi({ example: null }),
      rejected_by: z.string().nullable().openapi({ example: null }),
      rejected_at: z.string().nullable().openapi({ example: null }),
      rejection_reason: RejectionReasonSchema.nullable().openapi({ example: null }),
      rejection_supplement: z.string().nullable().openapi({ example: null }),
      cancelled_by: z.string().nullable().openapi({ example: null }),
      cancelled_at: z.string().nullable().openapi({ example: null }),
      cancellation_reason: z.string().nullable().openapi({ example: null }),

      // ── Cancellation state (FR-034, FR-036) ──
      same_day_cancel_count: z.number().openapi({ example: 0 }),
      same_day_cancel_date: z.string().nullable().openapi({ example: null }),

      // ── Timeline (FR-037) ──
      timeline: z
        .array(TimelineEntrySchema)
        .openapi({ description: 'Activity timeline, newest first' }),
    }).openapi({ description: 'Application detail information' }),
  })
  .openapi({
    title: 'GetApplicationDetailResponse',
    description: 'Response for getting application detail',
  });

// ─── Decisions ────────────────────────────────────────────────────────────────

/**
 * Approve Request Schema — approval carries no free-text reason in v5;
 * the decision context lives in the timeline.
 */
export const ApproveRequestSchema = z
  .object({
    /**
     * ⚠️ PROVISIONAL (FR-025a) — mock-ahead extension for the staff-discretionary
     * enrolment-fee exemption. Absent from C-01 revision 260624_v5; the reason a
     * reviewer types in the 個別に免除する panel is submitted here so the mock
     * table can resolve and record it at approval time. Not part of the settled
     * contract — a real Phase-2 backend may model this differently.
     */
    staff_exemption_reason: z.string().max(TEXTAREA_MAX_LENGTH).optional().openapi({
      example: '店舗判断による特例免除（キャンペーン終了直後の申込）',
      description:
        'PROVISIONAL — staff-discretionary exemption reason, if the reviewer entered one',
    }),
  })
  .openapi({
    title: 'ApproveRequest',
    description: 'Request payload for approving an application (all fields optional)',
  });

/**
 * Approve Response Schema — returns the updated application detail.
 */
export const ApproveResponseSchema = GetApplicationDetailResponseSchema.openapi({
  title: 'ApproveResponse',
  description: 'Response for approving an application',
});

/**
 * Reject Request Schema
 */
export const RejectRequestSchema = z
  .object({
    rejection_reason: RejectionReasonSchema.openapi({
      example: 'identity_incomplete',
      description: 'Standard rejection reason — one of exactly four values',
    }),
    rejection_supplement: z.string().max(TEXTAREA_MAX_LENGTH).optional().openapi({
      example: '本人確認書類の氏名が不一致',
      description: 'Optional free-text supplement',
    }),
  })
  .openapi({
    title: 'RejectRequest',
    description: 'Request payload for rejecting an application',
  });

export const RejectResponseSchema = GetApplicationDetailResponseSchema.openapi({
  title: 'RejectResponse',
  description: 'Response for rejecting an application',
});

/**
 * Cancel Request Schema
 */
export const CancelRequestSchema = z
  .object({
    cancellation_reason: z
      .string()
      .min(1, 'Cancellation reason is required')
      .max(TEXTAREA_MAX_LENGTH)
      .openapi({ example: '申請者都合によるキャンセル' }),
  })
  .openapi({
    title: 'CancelRequest',
    description: 'Request payload for cancelling an application',
  });

/**
 * Cancel Response Schema — carries the updated same-day counter so the client
 * shows it without a refetch.
 */
export const CancelResponseSchema = z
  .object({
    application: GetApplicationDetailResponseSchema.shape.application,
    same_day_cancel_count: z.number().openapi({ example: 1 }),
  })
  .openapi({
    title: 'CancelResponse',
    description: 'Response for cancelling an application',
  });

// ─── Memos ────────────────────────────────────────────────────────────────────

export const CreateMemoRequestSchema = z
  .object({
    content: z.string().min(1).max(TEXTAREA_MAX_LENGTH).openapi({
      example: '本人確認書類を目視確認済み。',
      description: 'Memo content — whitespace-only is rejected',
    }),
  })
  .openapi({
    title: 'CreateMemoRequest',
    description: 'Request to create a memo for a membership application',
  });

export const CreateMemoResponseSchema = z
  .object({
    timeline: z.array(TimelineEntrySchema).openapi({ description: 'Updated timeline' }),
  })
  .openapi({ title: 'CreateMemoResponse', description: 'Response for creating a memo' });

export const DeleteMemoResponseSchema = z
  .object({
    timeline: z.array(TimelineEntrySchema).openapi({ description: 'Updated timeline' }),
  })
  .openapi({ title: 'DeleteMemoResponse', description: 'Response for deleting a memo' });

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
  .openapi({ title: 'ErrorResponse', description: 'Error response' });

// ─── Enrollment fee masters ───────────────────────────────────────────────────

export const EnrollmentFeeMasterSchema = z
  .object({
    id: z.string().openapi({ example: 'EF001', description: 'Fee master ID' }),
    name: z.string().openapi({ example: '通常入会金', description: 'Fee name' }),
    amount: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 2200, description: 'Fee amount (JPY, tax-included)' }),
    brand_id: z.string().openapi({ example: 'BRD-001', description: 'Brand ID' }),
    is_active: z.boolean().openapi({ example: true }),
  })
  .openapi({ title: 'EnrollmentFeeMaster', description: 'Enrollment fee master record' });

export const GetEnrollmentFeeMastersQuerySchema = z
  .object({
    brand_id: z.string().optional().openapi({ example: 'BRD-001', description: 'Filter by brand' }),
  })
  .openapi({ title: 'GetEnrollmentFeeMastersQuery' });

export const GetEnrollmentFeeMastersResponseSchema = z
  .object({
    masters: z.array(EnrollmentFeeMasterSchema),
  })
  .openapi({
    title: 'GetEnrollmentFeeMastersResponse',
    description: 'Active enrollment fee masters for a brand',
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

// ─── Blacklist pre-check ──────────────────────────────────────────────────────

export const BlacklistCheckRequestSchema = z
  .object({
    family_name: z.string().min(1).max(TEXT_MAX_LENGTH).openapi({ example: '山田' }),
    given_name: z.string().min(1).max(TEXT_MAX_LENGTH).openapi({ example: '太郎' }),
    family_name_kana: z.string().min(1).max(TEXT_MAX_LENGTH).openapi({ example: 'ヤマダ' }),
    given_name_kana: z.string().min(1).max(TEXT_MAX_LENGTH).openapi({ example: 'タロウ' }),
    birth_date: z.string().openapi({ example: '1990-01-01' }),
    phone: z
      .string()
      .min(1)
      .max(TEXT_MAX_LENGTH)
      .regex(/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/)
      .openapi({ example: '090-1234-5678' }),
    email: z.string().email().max(TEXT_MAX_LENGTH).openapi({ example: 'taro@example.com' }),
    address: z
      .string()
      .max(TEXTAREA_MAX_LENGTH)
      .optional()
      .openapi({ example: '東京都渋谷区1-1-1' }),
  })
  .openapi({ title: 'BlacklistCheckRequest', description: 'Blacklist pre-check request' });

export const BlacklistCheckResponseSchema = z
  .object({
    state: BlacklistCheckStateSchema.openapi({ example: 'no_match' }),
    conditions: z.array(BlacklistConditionSchema).openapi({ description: 'Matched conditions' }),
  })
  .openapi({ title: 'BlacklistCheckResponse', description: 'Blacklist pre-check result' });

// ─── Direct (admin-screen) enrolment ─────────────────────────────────────────

export const DirectEnrollmentGenderSchema = z
  .enum(['male', 'female', 'other', 'no_answer'])
  .openapi({ title: 'DirectEnrollmentGender', description: 'Applicant gender (FR-045)' });

export const DirectEnrollmentApplicantSchema = z
  .object({
    family_name: z.string().min(1, { message: '姓を入力してください' }).max(TEXT_MAX_LENGTH),
    given_name: z.string().min(1, { message: '名を入力してください' }).max(TEXT_MAX_LENGTH),
    family_name_kana: z
      .string()
      .min(1, { message: 'セイを入力してください' })
      .max(TEXT_MAX_LENGTH)
      .regex(/^[゠-ヿ\s]+$/, 'カタカナで入力してください'),
    given_name_kana: z
      .string()
      .min(1, { message: 'メイを入力してください' })
      .max(TEXT_MAX_LENGTH)
      .regex(/^[゠-ヿ\s]+$/, 'カタカナで入力してください'),
    birth_date: z.string().min(1, { message: '生年月日を入力してください' }),
    gender: DirectEnrollmentGenderSchema,
    phone: z
      .string()
      .min(1, { message: '電話番号を入力してください' })
      .max(TEXT_MAX_LENGTH)
      .regex(/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/, { message: '有効な電話番号を入力してください' }),
    email: z
      .string()
      .min(1, { message: 'メールアドレスを入力してください' })
      .email({ message: '有効なメールアドレスを入力してください' })
      .max(TEXT_MAX_LENGTH),
    address: z.string().max(TEXTAREA_MAX_LENGTH).optional(),
    face_photo_id: z.string().min(1, { message: '顔写真をアップロードしてください' }),
  })
  .openapi({ title: 'DirectEnrollmentApplicant' });

export const DirectEnrollmentContractSchema = z
  .object({
    brand_id: z.string().min(1, { message: 'ブランドを選択してください' }),
    store_id: z.string().min(1, { message: '入会店舗を選択してください' }),
    plan_id: z.string().min(1, { message: 'プランを選択してください' }),
    usage_start_date: z.string().min(1, { message: '利用開始日を入力してください' }),
    payment_method: MembershipApplicationPaymentMethodSchema,
    campaign_id: z.string().nullable().optional(),
    /** JOYFIT only — FIT365 charges a card-issue fee and offers no master selector. */
    enrollment_fee_master_id: z.string().nullable().optional(),
  })
  .openapi({ title: 'DirectEnrollmentContract' });

export const DirectEnrollmentConsentSchema = z
  .object({
    agreement_datetime: z.string().min(1, { message: '合意日時を入力してください' }),
    parental_consent: z.boolean(),
  })
  .openapi({ title: 'DirectEnrollmentConsent' });

export const DirectEnrollmentRequestSchema = z
  .object({
    applicant: DirectEnrollmentApplicantSchema,
    contract: DirectEnrollmentContractSchema,
    consent: DirectEnrollmentConsentSchema,
  })
  .openapi({ title: 'DirectEnrollmentRequest', description: 'Direct enrollment request body' });

export const DirectEnrollmentResponseSchema = z
  .object({
    application: MembershipApplicationSchema,
  })
  .openapi({ title: 'DirectEnrollmentResponse', description: 'Direct enrollment response' });

// ─── Type exports ─────────────────────────────────────────────────────────────

export type MembershipApplicationStatus = z.infer<typeof MembershipApplicationStatusSchema>;
export type EnrollmentRoute = z.infer<typeof EnrollmentRouteSchema>;
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;
export type BlacklistCheckState = z.infer<typeof BlacklistCheckStateSchema>;
export type EnrollmentFeeExemptionKind = z.infer<typeof EnrollmentFeeExemptionKindSchema>;
export type MembershipApplicationPaymentMethod = z.infer<
  typeof MembershipApplicationPaymentMethodSchema
>;
export type MembershipApplication = z.infer<typeof MembershipApplicationSchema>;
export type MembershipApplicationSummary = z.infer<typeof MembershipApplicationSummarySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type GetMembershipApplicationsQuery = z.infer<typeof GetMembershipApplicationsQuerySchema>;
export type GetMembershipApplicationsResponse = z.infer<
  typeof GetMembershipApplicationsResponseSchema
>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type BlacklistCondition = z.infer<typeof BlacklistConditionSchema>;
export type FeeRow = z.infer<typeof FeeRowSchema>;
export type EnrollmentFeeExemption = z.infer<typeof EnrollmentFeeExemptionSchema>;
export type CompanionUpgrade = z.infer<typeof CompanionUpgradeSchema>;
export type GetApplicationDetailResponse = z.infer<typeof GetApplicationDetailResponseSchema>;
export type MembershipApplicationDetail = GetApplicationDetailResponse['application'];
export type ApproveRequest = z.infer<typeof ApproveRequestSchema>;
export type ApproveResponse = z.infer<typeof ApproveResponseSchema>;
export type RejectRequest = z.infer<typeof RejectRequestSchema>;
export type RejectResponse = z.infer<typeof RejectResponseSchema>;
export type CancelRequest = z.infer<typeof CancelRequestSchema>;
export type CancelResponse = z.infer<typeof CancelResponseSchema>;
export type CreateMemoRequest = z.infer<typeof CreateMemoRequestSchema>;
export type CreateMemoResponse = z.infer<typeof CreateMemoResponseSchema>;
export type DeleteMemoResponse = z.infer<typeof DeleteMemoResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type EnrollmentFeeMaster = z.infer<typeof EnrollmentFeeMasterSchema>;
export type GetEnrollmentFeeMastersQuery = z.infer<typeof GetEnrollmentFeeMastersQuerySchema>;
export type GetEnrollmentFeeMastersResponse = z.infer<typeof GetEnrollmentFeeMastersResponseSchema>;
export type UploadResponse = z.infer<typeof UploadResponseSchema>;
export type BlacklistCheckRequest = z.infer<typeof BlacklistCheckRequestSchema>;
export type BlacklistCheckResponse = z.infer<typeof BlacklistCheckResponseSchema>;
export type DirectEnrollmentGender = z.infer<typeof DirectEnrollmentGenderSchema>;
export type DirectEnrollmentApplicant = z.infer<typeof DirectEnrollmentApplicantSchema>;
export type DirectEnrollmentContract = z.infer<typeof DirectEnrollmentContractSchema>;
export type DirectEnrollmentConsent = z.infer<typeof DirectEnrollmentConsentSchema>;
export type DirectEnrollmentRequest = z.infer<typeof DirectEnrollmentRequestSchema>;
export type DirectEnrollmentResponse = z.infer<typeof DirectEnrollmentResponseSchema>;
