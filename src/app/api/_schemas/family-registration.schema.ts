import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Family registration status (snake_case)
 * Note: aligns with spec doc, but keeps it minimal for mocks.
 */
export const FamilyRegistrationStatusSchema = z.enum([
  'invited', // 招待送信済み
  'awaiting_acceptance', // 招待承諾待ち
  'declined', // 招待辞退
  'expired', // 招待期限切れ
  'awaiting_profile', // 個人情報入力待ち
  'pending_review', // 要確認（リスクあり）
  'approved', // 承認済み（入会完了前）
  'rejected', // 却下
  'completed', // 入会完了
]);

export const FamilyRelationshipSchema = z.enum([
  'spouse',
  'child',
  'parent',
  'sibling',
  'grandparent',
  'grandchild',
]);

export const FamilyRegistrationRiskReasonSchema = z
  .enum(['blacklist_match', 'duplicate_application', 'payment_failure', 'high_risk_score', 'other'])
  .openapi({ title: 'FamilyRegistrationRiskReason', description: 'Risk reason' });

export const PrimaryMemberStatusSchema = z
  .enum(['active', 'suspended', 'withdrawn'])
  .openapi({ title: 'PrimaryMemberStatus', description: 'Primary member status' });

export const PrimaryMemberTypeSchema = z
  .enum(['regular', 'family', 'corporate', 'company_discount'])
  .openapi({ title: 'PrimaryMemberType', description: 'Primary member type' });

export const FamilyMemberSchema = z
  .object({
    id: z.string().openapi({ example: 'M-00010', description: 'Child member id' }),
    member_number: z.string().openapi({ example: 'M-00010', description: 'Member number' }),
    name_kanji: z.string().openapi({ example: '山田 花子' }),
    relationship: FamilyRelationshipSchema.openapi({ example: 'child' }),
    joined_at: z.string().date().openapi({ example: '2024-01-15' }),
    status: z.enum(['active', 'suspended', 'withdrawn']).openapi({ example: 'active' }),
    monthly_fee: z.number().openapi({ example: 0, description: 'Monthly fee (JPY)' }),
    store_id: z.string().openapi({ example: 'store-001' }),
    store_name: z.string().openapi({ example: 'Fit365八潮店' }),
  })
  .openapi({ title: 'FamilyMember', description: 'Family member list item' });

export const GetFamilyMembersResponseSchema = z
  .object({
    members: z.array(FamilyMemberSchema),
    limit: z.number().openapi({ example: 3, description: 'Brand setting family_member_limit' }),
  })
  .openapi({
    title: 'GetFamilyMembersResponse',
    description: 'Response for getting primary member family members',
  });

export const CheckPrimaryMemberRequestSchema = z
  .object({
    primary_member_id: z.string().min(1).openapi({ example: 'M-00001' }),
  })
  .openapi({
    title: 'CheckPrimaryMemberRequest',
    description: 'Request to check if a primary member can invite/register more family members',
  });

export const CheckPrimaryMemberResponseSchema = z
  .object({
    ok: z.boolean().openapi({ example: true }),
    reasons: z.array(z.string()).openapi({
      example: [],
      description: 'Blocking reasons when ok=false',
    }),
    brand: z.enum(['joyfit', 'fit365']).openapi({ example: 'fit365' }),
    limit: z.number().openapi({ example: 3 }),
    current_count: z.number().openapi({ example: 2 }),
    fee: z.number().openapi({ example: 0, description: 'Brand setting family_member_fee (JPY)' }),
    payment_cycle: z.enum(['monthly', 'yearly']).openapi({ example: 'monthly' }),
  })
  .openapi({
    title: 'CheckPrimaryMemberResponse',
    description: 'Primary member eligibility check result',
  });

export const RiskEvaluationRequestSchema = z
  .object({
    primary_member_id: z.string().min(1).openapi({ example: 'M-00001' }),
    applicant: z
      .object({
        name: z.string().min(1).openapi({ example: '山田 花子' }),
        birthday: z.string().date().openapi({ example: '2000-01-01' }),
        phone: z.string().optional().openapi({ example: '09012345678' }),
        email: z.string().email().optional().openapi({ example: 'hanako@example.jp' }),
        relationship: FamilyRelationshipSchema.openapi({ example: 'child' }),
      })
      .openapi({ description: 'Child applicant info' }),
  })
  .openapi({
    title: 'RiskEvaluationRequest',
    description: 'Request payload for risk evaluation (mocked)',
  });

export const RiskEvaluationResponseSchema = z
  .object({
    risk_score: z.number().min(0).max(100).openapi({ example: 35 }),
    reasons: z.array(z.string()).openapi({ example: ['duplicate_check: ok'] }),
    recommended_action: z.enum(['auto_approve', 'manual_review', 'reject']).openapi({
      example: 'auto_approve',
    }),
  })
  .openapi({ title: 'RiskEvaluationResponse', description: 'Risk evaluation result' });

export const EkycResultSchema = z
  .object({
    verified: z.boolean().openapi({ example: true, description: 'eKYC総合判定' }),
    verified_at: z.string().datetime().optional().openapi({
      example: '2024-01-15T10:30:00Z',
      description: '検証日時',
    }),
    face_photo_url: z.string().url().optional().openapi({
      example: 'https://example.com/photos/face_001.jpg',
      description: '顔写真（申請者撮影）URL',
    }),
    id_document_url: z.string().url().optional().openapi({
      example: 'https://example.com/photos/id_001.jpg',
      description: '本人確認書類アップロード画像URL',
    }),
    document_type: z.string().optional().openapi({
      example: '運転免許証',
      description: '本人確認書類種別',
    }),
    face_match: z
      .object({
        similarity: z.number().min(0).max(100).openapi({
          example: 92.5,
          description: '顔認証類似度（%）',
        }),
        passed: z.boolean().openapi({ example: true, description: '顔認証判定結果' }),
      })
      .optional()
      .openapi({ description: '顔認証結果' }),
    blacklist_check: z
      .object({
        matched: z.boolean().openapi({ example: false, description: 'ブラックリスト一致有無' }),
        reason: z.string().optional().openapi({
          example: '過去に不正利用の記録あり',
          description: '一致理由',
        }),
      })
      .optional()
      .openapi({ description: 'ブラックリストチェック結果' }),
  })
  .openapi({ title: 'EkycResult', description: 'eKYC検証結果' });

export const FamilyRegistrationSchema = z
  .object({
    id: z.string().openapi({ example: 'FR-00001', description: 'Family registration id' }),
    created_at: z.string().datetime().openapi({ example: '2024-01-15T12:30:00Z' }),
    status: FamilyRegistrationStatusSchema.openapi({ example: 'awaiting_profile' }),
    primary_member_id: z.string().openapi({ example: 'M-00001' }),
    primary_member_name: z.string().openapi({ example: '山田 太郎' }),
    applicant_name: z.string().openapi({ example: '山田 花子' }),
    relationship: FamilyRelationshipSchema.openapi({ example: 'child' }),
    invite_expires_at: z.string().datetime().optional().openapi({
      example: '2024-01-22T12:30:00Z',
    }),
    store_id: z.string().openapi({ example: 'store-001' }),
    store_name: z.string().openapi({ example: 'Fit365八潮店' }),
    monthly_fee: z.number().openapi({ example: 0 }),
    risk_score: z.number().optional().openapi({ example: 20 }),
    risk_reason: FamilyRegistrationRiskReasonSchema.optional().openapi({
      example: 'blacklist_match',
      description: 'リスク主要理由',
    }),
    ekyc: EkycResultSchema.optional(),
  })
  .openapi({ title: 'FamilyRegistration', description: 'Family registration list item' });

export const GetFamilyRegistrationsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(50),
    status: FamilyRegistrationStatusSchema.optional(),
    search: z.string().optional().openapi({ example: '山田' }),
    sort_by: z.enum(['created_at', 'risk_score']).optional().default('created_at'),
    sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .openapi({ title: 'GetFamilyRegistrationsQuery', description: 'Query for family registrations' });

export const GetFamilyRegistrationsResponseSchema = z
  .object({
    registrations: z.array(FamilyRegistrationSchema),
    pagination: z.object({
      total: z.number(),
      total_pages: z.number(),
      current_page: z.number(),
      limit: z.number(),
    }),
  })
  .openapi({
    title: 'GetFamilyRegistrationsResponse',
    description: 'Paginated list response for family registrations',
  });

export const GetFamilyRegistrationDetailResponseSchema = z
  .object({
    registration: FamilyRegistrationSchema.extend({
      applicant: z
        .object({
          birthday: z.string().date().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
        })
        .optional(),
      primary_member: z
        .object({
          member_number: z.string().optional(),
          status: PrimaryMemberStatusSchema.optional(),
          member_type: PrimaryMemberTypeSchema.optional(),
          joined_at: z.string().optional(),
          tenure_months: z.number().optional(),
          family_member_count: z.number().optional(),
          family_member_limit: z.number().optional(),
          has_unpaid: z.boolean().optional(),
          has_past_unpaid: z.boolean().optional(),
          has_forced_withdrawal: z.boolean().optional(),
          monthly_usage_count: z.number().optional(),
        })
        .optional(),
      risk_details: z
        .array(
          z.object({
            reason: z.string(),
            score: z.number(),
            description: z.string(),
          }),
        )
        .optional(),
    }),
  })
  .openapi({
    title: 'GetFamilyRegistrationDetailResponse',
    description: 'Detail response for family registration',
  });

export const CreateFamilyRegistrationRequestSchema = z
  .object({
    primary_member_id: z.string().min(1),
    applicant: z.object({
      name: z.string().min(1),
      birthday: z.string().date(),
      relationship: FamilyRelationshipSchema,
      phone: z.string().optional(),
      email: z.string().email().optional(),
    }),
  })
  .openapi({
    title: 'CreateFamilyRegistrationRequest',
    description: 'Request payload to create a family registration',
  });

export const CreateFamilyRegistrationResponseSchema = z
  .object({
    success: z.boolean(),
    registration: FamilyRegistrationSchema,
  })
  .openapi({
    title: 'CreateFamilyRegistrationResponse',
    description: 'Create family registration response',
  });

export const ApproveFamilyRegistrationRequestSchema = z
  .object({
    approval_reason: z.string().optional(),
    staff_id: z.string().optional(),
  })
  .openapi({
    title: 'ApproveFamilyRegistrationRequest',
    description: 'Approve family registration request',
  });

export const ApproveFamilyRegistrationResponseSchema = z
  .object({
    success: z.boolean(),
    id: z.string(),
    status: z.literal('approved'),
    approved_at: z.string().datetime(),
    approved_by: z.string(),
  })
  .openapi({
    title: 'ApproveFamilyRegistrationResponse',
    description: 'Approve family registration response',
  });

export const RejectFamilyRegistrationRequestSchema = z
  .object({
    rejection_reason: z.string().min(1),
    staff_id: z.string().optional(),
  })
  .openapi({
    title: 'RejectFamilyRegistrationRequest',
    description: 'Reject family registration request',
  });

export const RejectFamilyRegistrationResponseSchema = z
  .object({
    success: z.boolean(),
    id: z.string(),
    status: z.literal('rejected'),
    rejected_at: z.string().datetime(),
    rejected_by: z.string(),
    rejection_reason: z.string(),
  })
  .openapi({
    title: 'RejectFamilyRegistrationResponse',
    description: 'Reject family registration response',
  });

export const CompleteFamilyRegistrationRequestSchema = z
  .object({
    staff_id: z.string().optional(),
  })
  .openapi({
    title: 'CompleteFamilyRegistrationRequest',
    description: 'Complete family registration request',
  });

export const CompleteFamilyRegistrationResponseSchema = z
  .object({
    success: z.boolean(),
    id: z.string(),
    status: z.literal('completed'),
    completed_at: z.string().datetime(),
    member_id: z.string().openapi({ example: 'M-00123', description: 'Created child member id' }),
  })
  .openapi({
    title: 'CompleteFamilyRegistrationResponse',
    description: 'Complete family registration response',
  });

export const BulkApproveFamilyRegistrationsRequestSchema = z
  .object({
    ids: z
      .array(z.string().min(1))
      .min(1)
      .openapi({ example: ['FR-00001', 'FR-00002'] }),
    approval_reason: z.string().optional(),
    staff_id: z.string().optional(),
  })
  .openapi({
    title: 'BulkApproveFamilyRegistrationsRequest',
    description: 'Bulk approve family registrations request',
  });

export const BulkApproveFamilyRegistrationsResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    results: z.array(
      z.object({
        id: z.string(),
        success: z.boolean(),
        status: z.literal('approved').optional(),
        error: z.string().optional(),
      }),
    ),
  })
  .openapi({
    title: 'BulkApproveFamilyRegistrationsResponse',
    description: 'Bulk approve family registrations response',
  });

export const BulkRejectFamilyRegistrationsRequestSchema = z
  .object({
    ids: z
      .array(z.string().min(1))
      .min(1)
      .openapi({ example: ['FR-00001', 'FR-00002'] }),
    rejection_reason: z.string().min(1),
    staff_id: z.string().optional(),
  })
  .openapi({
    title: 'BulkRejectFamilyRegistrationsRequest',
    description: 'Bulk reject family registrations request',
  });

export const BulkRejectFamilyRegistrationsResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    results: z.array(
      z.object({
        id: z.string(),
        success: z.boolean(),
        status: z.literal('rejected').optional(),
        error: z.string().optional(),
      }),
    ),
  })
  .openapi({
    title: 'BulkRejectFamilyRegistrationsResponse',
    description: 'Bulk reject family registrations response',
  });

export const GetFamilyRegistrationsSummaryQuerySchema = z
  .object({
    period: z.enum(['this_month', 'this_week', 'all']).optional().default('this_month'),
  })
  .openapi({
    title: 'GetFamilyRegistrationsSummaryQuery',
    description: 'Query for summary period',
  });

export const GetFamilyRegistrationsSummaryResponseSchema = z
  .object({
    period: z.enum(['this_month', 'this_week', 'all']).openapi({
      example: 'this_month',
      description: '集計期間（今月/今週/全期間）',
    }),
    // ── 今月のサマリ ─────────────────────────────────────────
    total_invites: z.number().openapi({ example: 42, description: '総招待数' }),
    total_completed: z.number().openapi({ example: 15, description: '総入会件数（家族会員のみ）' }),
    family_member_ratio: z.number().openapi({
      example: 0.28,
      description: '家族会員比率（全会員に占める割合）',
    }),
    acceptance_rate: z.number().openapi({ example: 0.72, description: '招待承諾率' }),
    // ── ステータス別カード ────────────────────────────────────
    by_status: z
      .record(FamilyRegistrationStatusSchema, z.number())
      .openapi({ description: 'ステータス別件数（期間フィルタ適用）' }),
    // ── 親会員別統計 ──────────────────────────────────────────
    top_primary_members: z
      .array(
        z.object({
          primary_member_id: z.string().openapi({ example: 'M-00001' }),
          primary_member_name: z.string().openapi({ example: '山田 太郎' }),
          family_count: z.number().openapi({ example: 3 }),
        }),
      )
      .openapi({ description: '子会員数が多い親会員TOP10' }),
    avg_children_per_primary: z.number().openapi({
      example: 1.5,
      description: '子会員の平均人数',
    }),
    // ── 全件合計（UI表示用）──────────────────────────────────
    total: z.number().openapi({ example: 200, description: '総件数（全期間）' }),
  })
  .openapi({
    title: 'GetFamilyRegistrationsSummaryResponse',
    description: 'Summary counts for family registrations',
  });

export const GetFamilyRegistrationsDashboardQuerySchema = z
  .object({
    period: z
      .enum(['this_month', 'last_3_months', 'last_year'])
      .optional()
      .default('this_month')
      .openapi({ description: '集計期間（今月/過去3ヶ月/過去1年）' }),
  })
  .openapi({
    title: 'GetFamilyRegistrationsDashboardQuery',
    description: 'Query parameters for family registrations dashboard',
  });

export const GetFamilyRegistrationsDashboardResponseSchema = z
  .object({
    period: z.enum(['this_month', 'last_3_months', 'last_year']).openapi({
      example: 'this_month',
      description: '集計期間',
    }),

    // ── サマリカード ─────────────────────────────────────────
    month_completed: z.number().openapi({ example: 18, description: '期間内の家族会員入会件数' }),
    family_member_ratio: z.number().openapi({
      example: 0.28,
      description: '家族会員比率（全会員比）',
    }),
    avg_children_per_primary: z.number().openapi({
      example: 1.5,
      description: '家族会員の平均人数（主会員1人あたり）',
    }),
    auto_approval_rate: z.number().openapi({
      example: 0.72,
      description: '自動承認率（auto_approve / 全完了件数）',
    }),

    // ── グラフ: 月次推移 ──────────────────────────────────────
    monthly_trend: z
      .array(
        z.object({
          month: z.string().openapi({ example: '2024-01', description: 'YYYY-MM' }),
          count: z.number().openapi({ example: 12 }),
        }),
      )
      .openapi({ description: '家族会員入会数の推移（月次）' }),

    // ── グラフ: 主会員種別別の家族会員比率 ─────────────────────
    by_member_type: z
      .array(
        z.object({
          member_type: z.string().openapi({ example: 'regular' }),
          label: z.string().openapi({ example: '通常会員' }),
          count: z.number().openapi({ example: 35 }),
          ratio: z.number().openapi({ example: 0.7 }),
        }),
      )
      .openapi({ description: '主会員種別別の家族会員比率' }),

    // ── グラフ: 家族会員数の分布 ──────────────────────────────
    family_size_distribution: z
      .array(
        z.object({
          label: z.string().openapi({ example: '1名' }),
          count: z.number().openapi({ example: 20 }),
        }),
      )
      .openapi({ description: '家族会員数の分布（1名 / 2名 / 3名以上）' }),

    // ── グラフ: 関係性別の内訳 ────────────────────────────────
    by_relationship: z
      .array(
        z.object({
          relationship: FamilyRelationshipSchema.openapi({ example: 'spouse' }),
          label: z.string().openapi({ example: '配偶者' }),
          count: z.number().openapi({ example: 15 }),
        }),
      )
      .openapi({ description: '関係性別の入会内訳（配偶者・子供・親など）' }),

    // ── 主会員分析 ────────────────────────────────────────────
    top_primary_members: z
      .array(
        z.object({
          primary_member_id: z.string().openapi({ example: 'M-00001' }),
          primary_member_name: z.string().openapi({ example: '山田 太郎' }),
          family_count: z.number().openapi({ example: 3 }),
        }),
      )
      .openapi({ description: '家族会員が多い主会員TOP10' }),
    avg_usage_comparison: z
      .object({
        family_member: z
          .number()
          .openapi({ example: 8.2, description: '家族会員の平均利用回数/月' }),
        regular_member: z
          .number()
          .openapi({ example: 6.5, description: '通常会員の平均利用回数/月' }),
      })
      .openapi({ description: '家族会員 vs 通常会員の平均利用回数比較' }),
  })
  .openapi({
    title: 'GetFamilyRegistrationsDashboardResponse',
    description: 'Dashboard data for family registrations (A-02-02-08)',
  });

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: 'Failed to process request' }),
  })
  .openapi({ title: 'ErrorResponse', description: 'Error response' });

export type FamilyRegistrationStatus = z.infer<typeof FamilyRegistrationStatusSchema>;
export type FamilyRelationship = z.infer<typeof FamilyRelationshipSchema>;
export type EkycResult = z.infer<typeof EkycResultSchema>;
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type GetFamilyMembersResponse = z.infer<typeof GetFamilyMembersResponseSchema>;
export type CheckPrimaryMemberRequest = z.infer<typeof CheckPrimaryMemberRequestSchema>;
export type CheckPrimaryMemberResponse = z.infer<typeof CheckPrimaryMemberResponseSchema>;
export type RiskEvaluationRequest = z.infer<typeof RiskEvaluationRequestSchema>;
export type RiskEvaluationResponse = z.infer<typeof RiskEvaluationResponseSchema>;
export type FamilyRegistration = z.infer<typeof FamilyRegistrationSchema>;
export type GetFamilyRegistrationsQuery = z.infer<typeof GetFamilyRegistrationsQuerySchema>;
export type GetFamilyRegistrationsResponse = z.infer<typeof GetFamilyRegistrationsResponseSchema>;
export type GetFamilyRegistrationDetailResponse = z.infer<
  typeof GetFamilyRegistrationDetailResponseSchema
>;
export type CreateFamilyRegistrationRequest = z.infer<typeof CreateFamilyRegistrationRequestSchema>;
export type CreateFamilyRegistrationResponse = z.infer<
  typeof CreateFamilyRegistrationResponseSchema
>;
export type ApproveFamilyRegistrationRequest = z.infer<
  typeof ApproveFamilyRegistrationRequestSchema
>;
export type ApproveFamilyRegistrationResponse = z.infer<
  typeof ApproveFamilyRegistrationResponseSchema
>;
export type RejectFamilyRegistrationRequest = z.infer<typeof RejectFamilyRegistrationRequestSchema>;
export type RejectFamilyRegistrationResponse = z.infer<
  typeof RejectFamilyRegistrationResponseSchema
>;
export type CompleteFamilyRegistrationRequest = z.infer<
  typeof CompleteFamilyRegistrationRequestSchema
>;
export type CompleteFamilyRegistrationResponse = z.infer<
  typeof CompleteFamilyRegistrationResponseSchema
>;
export type BulkApproveFamilyRegistrationsRequest = z.infer<
  typeof BulkApproveFamilyRegistrationsRequestSchema
>;
export type BulkApproveFamilyRegistrationsResponse = z.infer<
  typeof BulkApproveFamilyRegistrationsResponseSchema
>;
export type BulkRejectFamilyRegistrationsRequest = z.infer<
  typeof BulkRejectFamilyRegistrationsRequestSchema
>;
export type BulkRejectFamilyRegistrationsResponse = z.infer<
  typeof BulkRejectFamilyRegistrationsResponseSchema
>;
export type GetFamilyRegistrationsSummaryQuery = z.infer<
  typeof GetFamilyRegistrationsSummaryQuerySchema
>;
export type GetFamilyRegistrationsSummaryResponse = z.infer<
  typeof GetFamilyRegistrationsSummaryResponseSchema
>;
export type GetFamilyRegistrationsDashboardQuery = z.infer<
  typeof GetFamilyRegistrationsDashboardQuerySchema
>;
export type GetFamilyRegistrationsDashboardResponse = z.infer<
  typeof GetFamilyRegistrationsDashboardResponseSchema
>;
