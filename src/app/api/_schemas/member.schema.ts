import {
  PERSONAL_DATA_DELETE_CONFIRMATION,
  PERSONAL_DATA_DELETE_REASON_MAX_LENGTH,
} from '@/app/api/_lib/member-operation';
import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { SurveyTemplateTypeSchema } from './survey.schema';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Month contract for every request field that carries a year-month (`YYYY-MM`).
 * The UI's MonthPicker works in `YYYY/MM`, so the FE normalizes with `toApiYearMonth`
 * before sending; enforcing the pattern here keeps that conversion from silently regressing.
 */
export const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;

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
 *
 * The `members.member_status` DB enum (8 values), in PostgreSQL enum definition
 * order. Gate stop is NOT a member status: it is an orthogonal flag
 * (`has_gate_stop`), because a member can be suspended AND gate-stopped at the
 * same time — backend design answer 2026-08-10 (API review QA01 §1-2).
 */
export const MemberStatusSchema = z.enum([
  'provisional',
  'active',
  'pending_suspended',
  'suspended',
  'pending_withdrawal',
  'withdrawal_pending_processing',
  'withdrawn',
  'forced_withdrawal',
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
export const GenderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']).openapi({
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
    brand_group: MainBrandSchema.openapi({
      example: 'fit365',
      description:
        "Business brand group the member belongs to (JOYFIT / FIT365). The store's " +
        'sub-brand is a separate axis and is not carried on the member row',
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
    has_gate_stop: z.boolean().openapi({
      example: false,
      description:
        'Whether an uncleared manual gate stop exists. Orthogonal to `status` — a ' +
        'suspended member can be gate-stopped at the same time',
    }),
    promotion_code: z.string().optional().openapi({
      example: 'SPRING2023',
      description: 'Code of the promotion used at enrollment (campaign master `code`)',
    }),
    phone: z.string().openapi({
      example: '090-1234-5678',
      description: 'Phone number',
    }),
    email: z.string().email().openapi({
      example: 'member00001@example.jp',
      description: 'Email address',
    }),
    /**
     * A-01 FR-015 — the blacklist registration Sheet's identity card renders the
     * birthdate and the face photo so the operator can confirm they have the right
     * person before listing them. Both exist on the member-detail response already;
     * projecting them onto the list item is what avoids a second round-trip
     * (spec Q-04 / research §3).
     */
    date_of_birth: z.string().date().nullable().optional().openapi({
      example: '1985-04-12',
      description: 'Date of birth — rendered by the blacklist registration identity card',
    }),
    face_photo_url: z.string().nullable().optional().openapi({
      description: 'Face photo URL — rendered by member pickers and the blacklist identity card',
    }),
    /**
     * A-01 FR-050a — lets the registration Sheet refuse an already-listed member before
     * submission instead of relying on the server's 409. HQ / system roles only, matching
     * the real contract's restriction on the same field.
     */
    has_blacklist: z.boolean().optional().openapi({
      example: false,
      description: 'Whether an active blacklist entry exists (HQ / system roles only)',
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
    /**
     * A-01 FR-038a — the blacklist registration Sheet opts into prefix matching so it
     * behaves the same against this mock as it will against the real endpoint, whose
     * member search is `ILIKE 'kw%'` on every field except the two unique keys.
     *
     * Opt-in on purpose: this route also backs A-01's own member list and several
     * pickers, and flipping their matching would silently change all of them
     * (research §4).
     */
    match_mode: z.enum(['substring', 'prefix']).optional().default('substring').openapi({
      example: 'prefix',
      description:
        'Search matching mode. substring (default) = current behaviour; prefix = prefix match on name/kana/email/phone, exact on member number and legacy code',
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
    brand_group: z.preprocess(
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
        .array(MainBrandSchema)
        .optional()
        .openapi({
          example: ['joyfit', 'fit365'],
          description:
            'Filter by brand group (array). The A-01 「ブランド」 dropdown maps here 1:1',
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
    main_contract_id: z.preprocess(
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
          example: ['MC001'],
          description: 'Filter by main contract (plan) id (array)',
        }),
    ),
    // 入会期間 / 最終来館日 are absolute date bounds, not relative keywords: the
    // screen's presets (今月/先月/… and 直近1週間/3週間以上来館なし/…) are expanded to
    // concrete dates by the client — backend design answer 2026-08-10 (QA01 §2.3).
    enrolled_from: z.string().date().optional().openapi({
      example: '2026-07-01',
      description: 'Inclusive lower bound on the join date (入会日)',
    }),
    enrolled_to: z.string().date().optional().openapi({
      example: '2026-07-31',
      description: 'Inclusive upper bound on the join date (入会日)',
    }),
    last_entry_from: z.string().date().optional().openapi({
      example: '2026-08-01',
      description: 'Inclusive lower bound on the last-entry date',
    }),
    last_entry_to: z.string().date().optional().openapi({
      example: '2026-07-10',
      description: 'Inclusive upper bound on the last-entry date',
    }),
    include_never_entered: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'boolean') return val;
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      },
      z
        .boolean()
        .optional()
        .openapi({
          example: true,
          description:
            'Keep members that have never entered even though a last-entry bound is set. ' +
            'The 「3週間以上来館なし」/「1ヶ月以上来館なし」 buckets must send this, since ' +
            'never-visited members carry the highest churn risk (A-01 FR-001). Ignored ' +
            'when neither bound is set',
        }),
    ),
    promo_code: z
      .string()
      .min(1)
      .max(30)
      // Codes follow 「店舗ID＋英数字5桁」 (e.g. STR01-Q7R8S), so a hyphen is valid.
      // Passing a campaign NAME here is still a client bug and must fail loudly
      // rather than quietly return an empty roster.
      .regex(/^[A-Za-z0-9-]+$/)
      .optional()
      .openapi({
        example: 'STR01-Q7R8S',
        description:
          'Filter by the promotion code used at enrollment. Exact match on the campaign ' +
          "master's `code` — not the campaign name (G-06 FR-011)",
      }),
    has_gate_stop: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === '') return undefined;
        if (typeof val === 'boolean') return val;
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      },
      z
        .boolean()
        .optional()
        .openapi({
          example: true,
          description:
            "Filter by an uncleared manual gate stop. The screen's 「ゲートストップ」 status " +
            'option sends `has_gate_stop=true` and no `status`, because gate stop is ' +
            'orthogonal to member status',
        }),
    ),
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
      .enum(['member_number', 'joined_at', 'last_visit_date', 'name', 'status'])
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
    pagination: PaginationSchema.extend({
      totalAllItems: z.number().int().nonnegative().openapi({
        example: 200,
        description: '全件数（フィルター適用前）',
      }),
    }).openapi({
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
        // No `scope`: a gate stop always covers every store, so there is nothing
        // to choose (backend design answer 2026-08-10, QA03 §2.2).
        reason_category: z.enum(['nuisance', 'unpaid', 'fraudulent_use', 'other']),
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

// ─── Member Detail Bundle (A-01-01 head-up bundle, camelCase per API design doc) ───
// Field shapes follow the API design doc (Member Management › Get member detail);
// enums reuse the project's existing snake_case enums (MemberStatus/Brand/Gender/MemberType)
// to keep shared labels/constants and the list feature working. Prototype wins on UI.

const StaffRefSchema = z
  .object({
    staffId: z.string().openapi({ example: 'staff-001', description: 'Staff ID' }),
    displayName: z.string().openapi({ example: '管理者A', description: 'Staff display name' }),
  })
  .openapi({ title: 'StaffRef', description: 'Reference to a staff member' });

const MemberRefSchema = z
  .object({
    memberId: z.string().openapi({ example: 'M-00001', description: 'Member ID' }),
    memberNumber: z.string().openapi({ example: 'M-00001', description: 'Member number' }),
    displayName: z
      .string()
      .optional()
      .openapi({ example: '佐藤 花子', description: 'Display name' }),
  })
  .openapi({ title: 'MemberRef', description: 'Reference to another member' });

export const MemberPersonalInfoSchema = z
  .object({
    lastName: z.string().openapi({ example: '佐藤', description: 'Last name (kanji)' }),
    firstName: z.string().openapi({ example: '花子', description: 'First name (kanji)' }),
    lastNameKana: z
      .string()
      .optional()
      .openapi({ example: 'サトウ', description: 'Last name (kana)' }),
    firstNameKana: z
      .string()
      .optional()
      .openapi({ example: 'ハナコ', description: 'First name (kana)' }),
    gender: GenderSchema.optional().openapi({ example: 'female', description: 'Gender' }),
    dateOfBirth: z
      .string()
      .optional()
      .openapi({ example: '1990-01-01', description: 'Date of birth (ISO date)' }),
    email: z
      .string()
      .optional()
      .openapi({ example: 'member00001@example.jp', description: 'Email' }),
    phone: z.string().optional().openapi({ example: '090-1234-5678', description: 'Phone number' }),
    postalCode: z.string().optional().openapi({ example: '1500002', description: 'Postal code' }),
    prefecture: z.string().optional().openapi({ example: '東京都', description: 'Prefecture' }),
    city: z.string().optional().openapi({ example: '渋谷区', description: 'City' }),
    streetAddress: z
      .string()
      .optional()
      .openapi({ example: '渋谷1-2-3', description: 'Street address' }),
    building: z
      .string()
      .optional()
      .openapi({ example: 'サンプルマンション101', description: 'Building' }),
    bloodType: z.string().optional().openapi({ example: 'A', description: 'Blood type' }),
    facePhotoUrl: z
      .string()
      .optional()
      .openapi({ example: 'https://example.com/photo.jpg', description: 'Face photo URL' }),
    emergencyContact: MemberEmergencyContactSchema.optional().openapi({
      description: 'Emergency contact',
    }),
  })
  .openapi({ title: 'MemberPersonalInfo', description: 'Member personal information' });

export const MemberPrimaryStoreSchema = z
  .object({
    storeId: z.string().openapi({ example: 'store-001', description: 'Store ID' }),
    code: z.string().openapi({ example: 'ST001', description: 'Store code' }),
    name: z.string().openapi({ example: 'Fit365八潮店', description: 'Store name' }),
    brandEnum: BrandSchema.openapi({ example: 'fit365', description: 'Store brand' }),
  })
  .openapi({ title: 'MemberPrimaryStore', description: 'Member primary store' });

export const MemberFeeAdjustmentRefSchema = z
  .object({
    feeAdjustmentId: z.string().openapi({ example: 'fa-001', description: 'Fee adjustment ID' }),
    startDate: z.string().openapi({ example: '2026-05-01', description: 'Start date' }),
    endDate: z.string().optional().openapi({ example: '2026-08-31', description: 'End date' }),
    adjustedMonthlyFee: z
      .number()
      .int()
      .openapi({ example: 7800, description: 'Adjusted monthly fee' }),
    reason: z.string().optional().openapi({ example: '長期利用割引', description: 'Reason' }),
  })
  .openapi({ title: 'MemberFeeAdjustmentRef', description: 'Active fee adjustment' });

/**
 * A-01 FR-006 / FR-013a: a submitted 主契約変更 is a *pending application* applied at month start,
 * not an immediate mutation. At most one may be pending per active contract.
 */
export const MemberPendingPlanChangeSchema = z
  .object({
    // Where the reservation came from. A bulk change is an HQ instruction, not a
    // request awaiting approval, so the screen must word the two differently
    // (backend design answer 2026-08-10, QA09 §2.2).
    source: z.enum(['application', 'bulk_job']).openapi({
      example: 'application',
      description:
        'application = single change requested from the member detail, bulk_job = list-wide change',
    }),
    sourceId: z
      .string()
      .openapi({ example: 'ppc-001', description: 'Application ID or bulk job ID' }),
    applicationId: z
      .string()
      .openapi({ example: 'ppc-001', description: 'Plan change application ID' }),
    toPlanId: z.string().openapi({ example: 'MC002', description: 'Destination plan master ID' }),
    toPlanName: z
      .string()
      .openapi({ example: 'プレミアム会員', description: 'Destination plan name' }),
    toMonthlyFee: z
      .number()
      .int()
      .openapi({ example: 11000, description: 'Destination monthly fee (tax included)' }),
    effectiveFrom: z
      .string()
      .openapi({ example: '2026-08-01', description: 'Always the 1st of the following month' }),
    requestedAt: z
      .string()
      .openapi({ example: '2026-07-29T10:12:00+09:00', description: 'Application timestamp' }),
    requestedBy: z.string().openapi({ example: '管理者A', description: 'Operator name' }),
  })
  .openapi({
    title: 'MemberPendingPlanChange',
    description: 'Pending main-contract (plan) change application',
  });

export const MemberCurrentMainContractSchema = z
  .object({
    contractId: z.string().openapi({ example: 'contract-001', description: 'Contract ID' }),
    plan: z
      .object({
        planId: z.string().openapi({ example: 'plan-001', description: 'Plan ID' }),
        name: z.string().openapi({ example: 'レギュラー会員', description: 'Plan name' }),
        code: z.string().openapi({ example: 'REGULAR', description: 'Plan code' }),
        monthlyFee: z.number().int().openapi({ example: 8580, description: 'Monthly fee' }),
      })
      .openapi({ description: 'Contract plan' }),
    store: MemberPrimaryStoreSchema.pick({ storeId: true, code: true, name: true }).openapi({
      description: 'Contract store',
    }),
    contractStatus: z
      .enum(['active', 'suspended', 'cancelled'])
      .openapi({ example: 'active', description: 'Contract status' }),
    startDate: z.string().openapi({ example: '2024-01-15', description: 'Contract start date' }),
    endDate: z
      .string()
      .optional()
      .openapi({ example: '2026-01-14', description: 'Contract end date' }),
    usageStartDate: z
      .string()
      .optional()
      .openapi({ example: '2024-01-15', description: 'Usage start date' }),
    cancellationFeeUntil: z
      .string()
      .optional()
      .openapi({ example: '2025-01-14', description: 'Cancellation fee period end' }),
    campaign: z
      .object({
        campaignId: z.string().openapi({ example: 'camp-001', description: 'Campaign ID' }),
        name: z.string().openapi({ example: '春の入会キャンペーン', description: 'Campaign name' }),
      })
      .optional()
      .openapi({ description: 'Applied campaign' }),
    activeFeeAdjustment: MemberFeeAdjustmentRefSchema.optional().openapi({
      description: 'Active individual fee adjustment',
    }),
    // A-01 FR-013a: a submitted plan change stays pending until month start
    pendingPlanChange: MemberPendingPlanChangeSchema.optional().openapi({
      description: 'Pending main-contract change application',
    }),
    // A-01 FR-S001: a point-based discount active at suspension time becomes a refund target
    activePointDiscount: z
      .object({
        monthlyAmount: z
          .number()
          .int()
          .openapi({ example: 550, description: 'Monthly discount amount in yen' }),
        pointName: z
          .string()
          .openapi({ example: 'ENJOYポイント', description: 'Brand point name' }),
      })
      .optional()
      .openapi({ description: 'Active point-based discount (FR-S001 refund target)' }),
    activeSuspension: z
      .object({
        suspensionApplicationId: z.string().openapi({ example: 'susp-001' }),
        startDate: z.string().openapi({ example: '2026-07-01' }),
        endDate: z.string().openapi({ example: '2026-09-30' }),
      })
      .optional()
      .openapi({ description: 'Active suspension' }),
    pendingWithdrawal: z
      .object({
        withdrawalApplicationId: z.string().openapi({ example: 'wd-001' }),
        scheduledWithdrawalDate: z.string().openapi({ example: '2026-08-31' }),
      })
      .optional()
      .openapi({ description: 'Pending withdrawal' }),
  })
  .openapi({ title: 'MemberCurrentMainContract', description: 'Current main contract summary' });

/**
 * The four entry-permission patterns defined by A-01 FR-014 / B-01 FR-M005.
 * Single enum shared by gate-stop read and the member-detail bundle.
 *
 * `always_open` means "no gate stop at all", so it never appears on a stored
 * record — only three of the four values can come back from the API. Setting it
 * is the release flow, not a set (see `GateStopSetPatternSchema`).
 */
export const GateStopPatternSchema = z
  .enum(['always_open', 'staffed_hours_deny', 'always_deny', 'unstaffed_hours_deny'])
  .openapi({
    title: 'GateStopPattern',
    example: 'always_deny',
    description:
      'Gate stop pattern (A-01 FR-014): always_open=常時入退館（ストップなし）, staffed_hours_deny=スタッフ常駐時間のみ入館不可, always_deny=常時入館不可, unstaffed_hours_deny=スタッフ常駐時間以外は入館不可',
  });

export const MemberGateStopBundleSchema = z
  .object({
    pattern: GateStopPatternSchema.openapi({ description: 'Gate stop pattern' }),
    reasonCategory: z
      .enum(['nuisance', 'unpaid', 'fraudulent_use', 'other'])
      .openapi({ example: 'unpaid', description: 'Why the gate stop was set' }),
    // NOT a scope: a gate stop always applies to every store. This only records
    // which store's staff set it, for audit. Null when set by head office.
    setAtStore: MemberPrimaryStoreSchema.pick({ storeId: true, code: true, name: true })
      .nullable()
      .openapi({ description: 'Store whose staff set the gate stop (audit only, null for HQ)' }),
    messageType: z
      .enum(['allow_after_confirm', 'deny_after_confirm'])
      .openapi({ example: 'deny_after_confirm', description: 'Gate terminal message behaviour' }),
    message: z.string().optional().openapi({ description: 'Gate terminal message' }),
    setAt: z.string().openapi({ example: '2026-03-01T09:30:00.000Z', description: 'Set datetime' }),
    setBy: StaffRefSchema.openapi({ description: 'Staff who set the gate stop' }),
  })
  .openapi({ title: 'MemberGateStopBundle', description: 'Current gate stop settings' });

/** One entry of the family group shown on 基本情報 > 家族会員. */
export const MemberFamilyMemberSchema = z
  .object({
    memberId: z.string().openapi({ example: 'M-00001' }),
    memberNumber: z.string().openapi({ example: 'JF-0005678' }),
    displayName: z.string().openapi({ example: '山田 太郎' }),
    // The member whose page is open. The 本人 badge is driven by this, never by
    // comparing ids on the client.
    isSelf: z.boolean().openapi({ example: false }),
    memberStatus: MemberStatusSchema.openapi({ example: 'active' }),
  })
  .openapi({ title: 'MemberFamilyMember', description: 'A member of the family group' });

/**
 * Family group, resolved from the parent, so opening a child's page still lists
 * their siblings. Order is guaranteed: parent first, then member number ascending.
 * Withdrawn / deleted members are excluded (backend design answer 2026-08-10, QA02 §2.1).
 */
export const MemberFamilyBundleSchema = z
  .object({
    role: z
      .enum(['parent', 'child', 'none'])
      .openapi({ example: 'parent', description: "This member's place in the family group" }),
    parent: z
      .object({
        memberId: z.string(),
        memberNumber: z.string(),
        displayName: z.string(),
      })
      .nullable()
      .openapi({ description: 'The parent member — only when `role` is `child`' }),
    members: z
      .array(MemberFamilyMemberSchema)
      .openapi({ description: 'Everyone in the group, including this member' }),
    remainingSlots: z
      .number()
      .int()
      .nullable()
      .openapi({ example: 1, description: 'How many more can be added; null when `role: none`' }),
  })
  .openapi({ title: 'MemberFamilyBundle', description: 'Family group membership' });

/**
 * Notification topics the member can opt in to, in the order the backend defines
 * them. The CRM is read-only here — only the member can change these in the app.
 */
export const NotificationTopicSchema = z
  .enum([
    'visit_stamp',
    'points',
    'achievements',
    'training_reminder',
    'body_measurement_reminder',
    'condition_record',
    'follow_request',
    'news',
    'campaign',
    'reservation_reminder',
  ])
  .openapi({ title: 'NotificationTopic', example: 'visit_stamp' });

export const NotificationPreferenceSchema = z
  .object({
    topic: NotificationTopicSchema,
    isOptedIn: z
      .boolean()
      .openapi({ example: true, description: 'Topics the member never touched come back as true' }),
    updatedAt: z
      .string()
      .nullable()
      .openapi({ description: 'Null when the member has never changed this topic' }),
  })
  .openapi({ title: 'NotificationPreference', description: 'Opt-in state for one topic' });

export const MemberBlacklistBundleSchema = z
  .object({
    blacklistId: z.string().openapi({ example: 'bl-001', description: 'Blacklist ID' }),
    level: z.number().int().optional().openapi({ example: 2, description: 'Blacklist level' }),
    reason: z.string().optional().openapi({ example: '迷惑行為', description: 'Reason' }),
    // Separate from `reason`: the manual-registration route used to collapse the two into one
    // field (`memo ?? reason`), which silently discarded the reason whenever a memo was given.
    memo: z
      .string()
      .optional()
      .openapi({ example: '店内での迷惑行為', description: 'Supplementary memo' }),
    isActive: z.boolean().openapi({ example: true, description: 'Whether blacklist is active' }),
    registeredAt: z
      .string()
      .openapi({ example: '2026-02-01T10:00:00.000Z', description: 'Registered datetime' }),
    registeredBy: StaffRefSchema.openapi({ description: 'Staff who registered' }),
  })
  .openapi({ title: 'MemberBlacklistBundle', description: 'Blacklist registration' });

export const MemberLinkingSchema = z
  .object({
    status: z
      .enum(['unlinked', 'linked', 'invalidated'])
      .openapi({ example: 'linked', description: 'App-linking status' }),
    linkedAt: z.string().optional().openapi({ description: 'Linked datetime' }),
    invalidatedAt: z.string().optional().openapi({ description: 'Invalidated datetime' }),
    invalidatedReason: z.string().optional().openapi({ description: 'Invalidation reason' }),
  })
  .openapi({ title: 'MemberLinking', description: 'App-linking status' });

export const MemberReferralBundleSchema = z
  .object({
    inboundFlag: z
      .boolean()
      .openapi({ example: true, description: 'Whether the member joined via referral' }),
    byMember: MemberRefSchema.optional().openapi({ description: 'Referrer member' }),
  })
  .openapi({ title: 'MemberReferralBundle', description: 'Referral relationship summary' });

export const MemberActivePenaltySchema = z
  .object({
    penaltyType: z
      .enum(['studio', 'personal_training', 'body_care'])
      .openapi({ example: 'studio', description: 'Penalty type' }),
    endAt: z
      .string()
      .openapi({ example: '2026-08-01T00:00:00.000Z', description: 'Penalty end datetime' }),
    noShowCount: z
      .number()
      .int()
      .optional()
      .openapi({ example: 3, description: 'No-show count that triggered the penalty' }),
    appliedAt: z.string().optional().openapi({ description: 'Penalty applied datetime' }),
    // D-01 FR-010: the 予約ペナルティ解除 sheet lists the reservations that produced the
    // no-show count, so the operator can see what they are forgiving before releasing.
    triggeringReservations: z
      .array(z.string())
      .optional()
      .openapi({
        example: ['2026/04/08(水) 19:00 ヨガ基礎', '2026/04/11(土) 10:00 ピラティス'],
        description: 'Reservations that triggered the penalty (display strings)',
      }),
    targetWeek: z
      .string()
      .optional()
      .openapi({ example: '2026/04/07〜04/13', description: 'Week the no-shows fell in' }),
  })
  .openapi({ title: 'MemberActivePenalty', description: 'Active reservation penalty' });

export const MemberConstraintsSchema = z
  .object({
    hasUnpaidFee: z.boolean().openapi({ example: false, description: 'Has unpaid fees' }),
    inCancellationPeriod: z
      .boolean()
      .openapi({ example: false, description: 'In cancellation penalty period' }),
    isOptionRestricted: z
      .boolean()
      .openapi({ example: false, description: 'Option actions restricted' }),
  })
  .openapi({ title: 'MemberConstraints', description: 'Constraint flags for member operations' });

export const GetMemberDetailResponseSchema = z
  .object({
    memberId: z.string().openapi({ example: 'M-00001', description: 'Member ID' }),
    memberNumber: z.string().openapi({ example: 'M-00001', description: 'Member number' }),
    legacyMemberCode: z
      .string()
      .optional()
      .openapi({ example: 'O-M-00001', description: 'Legacy (old) member number' }),
    memberType: MemberTypeSchema.openapi({ example: 'regular', description: 'Member type' }),
    memberStatus: MemberStatusSchema.openapi({ example: 'active', description: 'Member status' }),
    // The member row carries the brand GROUP only; the sub-brand lives on the
    // primary store (`primaryStore.brandEnum`) — backend design answer 2026-08-10
    // (QA01 §1-4). Reading a sub-brand off the member is no longer possible.
    brandGroup: MainBrandSchema.openapi({
      example: 'fit365',
      description: 'Business brand group the member belongs to (JOYFIT / FIT365)',
    }),
    personalInfo: MemberPersonalInfoSchema.openapi({ description: 'Personal information' }),
    primaryStore: MemberPrimaryStoreSchema.openapi({ description: 'Primary store' }),
    currentMainContract: MemberCurrentMainContractSchema.nullable().openapi({
      description: 'Current main contract (null when none)',
    }),
    contractName: z
      .string()
      .optional()
      .openapi({ example: 'レギュラー会員', description: 'Main contract display name' }),
    registrationDate: z
      .string()
      .openapi({ example: '2024-01-15T00:00:00.000Z', description: 'Registration datetime' }),
    enrolledAt: z.string().openapi({ example: '2024-01-15', description: 'Enrollment date' }),
    // 基本情報 > 入会情報 > 入会キャンペーン. Snapshot of the campaign applied *at
    // enrollment time* — deliberately separate from `currentMainContract.campaign`,
    // which reflects the contract in force today and changes on plan changes.
    enrollmentCampaign: z
      .object({
        campaignId: z.string().openapi({ example: 'CP002', description: 'Campaign ID' }),
        name: z.string().openapi({ example: '春の入会キャンペーン', description: 'Campaign name' }),
      })
      .nullable()
      .openapi({ description: 'Campaign applied at enrollment (null when none)' }),
    withdrawnAt: z
      .string()
      .optional()
      .openapi({ example: '2026-02-01', description: 'Withdrawal date' }),
    lastEntryAt: z
      .string()
      .nullable()
      .openapi({ example: '2026-04-20T18:00:00.000Z', description: 'Last entry datetime' }),
    joinRoute: z.string().optional().openapi({ example: '紹介', description: 'Join route' }),
    recentVisitCount: z
      .number()
      .int()
      .openapi({ example: 8, description: 'Visit count in the last 30 days' }),
    monthlyVisitCount: z
      .number()
      .int()
      .openapi({ example: 12, description: 'Visit count this month' }),
    totalVisitCount: z
      .number()
      .int()
      .openapi({ example: 240, description: 'Cumulative visit count' }),
    unpaidAmount: z
      .number()
      .int()
      .openapi({ example: 0, description: 'Unpaid amount (0 if none)' }),
    family: MemberFamilyBundleSchema.openapi({
      description: 'Family group this member belongs to (never null; `role: none` when solo)',
    }),
    notificationPreferences: z
      .array(NotificationPreferenceSchema)
      .openapi({ description: 'Per-topic notification opt-ins — always all 10, in定義順' }),
    gateStop: MemberGateStopBundleSchema.nullable().openapi({
      description: 'Gate stop settings (null when not gate-stopped)',
    }),
    blacklist: MemberBlacklistBundleSchema.nullable().openapi({
      description: 'Blacklist registration (null when not blacklisted)',
    }),
    activePenalty: MemberActivePenaltySchema.nullable().openapi({
      description: 'Active reservation penalty (null when none)',
    }),
    linking: MemberLinkingSchema.openapi({ description: 'App-linking status' }),
    referral: MemberReferralBundleSchema.openapi({ description: 'Referral relationship summary' }),
    memo: z.string().optional().openapi({ example: '特記事項なし', description: 'Staff memo' }),
    anonymizedAt: z.string().nullable().optional().openapi({ description: 'Anonymized datetime' }),
    bodyDataCrmConsentAt: z
      .string()
      .nullable()
      .openapi({ description: 'Body-data CRM consent datetime (null when not consented)' }),
    bodyDataConsentStatus: z.enum(['granted', 'pending', 'denied']).openapi({
      example: 'granted',
      description:
        'Body-data CRM consent status: granted (同意) / pending (未同意) / denied (拒否). Prototype-driven; the real API only distinguishes granted vs not (403).',
    }),
    createdAt: z.string().openapi({ description: 'Created datetime' }),
    updatedAt: z.string().openapi({ description: 'Updated datetime' }),
    constraints: MemberConstraintsSchema.openapi({ description: 'Constraint flags' }),
  })
  .openapi({
    title: 'GetMemberDetailResponse',
    description: 'Member detail head-up bundle (A-01-01)',
  });

/**
 * Update Basic Info Request Schema
 */
export const UpdateBasicInfoRequestSchema = z
  .object({
    // Family and given name travel separately: the form already collects four
    // fields, and joining them into one string loses the boundary the backend
    // stores (backend design answer 2026-08-10, QA09 §2.3).
    last_name: z.string().min(1).max(50).optional().openapi({ example: '佐藤' }),
    first_name: z.string().min(1).max(50).optional().openapi({ example: '花子' }),
    last_name_kana: z.string().min(1).max(50).optional().openapi({ example: 'サトウ' }),
    first_name_kana: z.string().min(1).max(50).optional().openapi({ example: 'ハナコ' }),
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
    pointBalance: z.number().int().nonnegative().openapi({
      example: 1200,
      description: 'Current point balance',
    }),
    // Per the design (Member Financial History) the point name is resolved server-side
    // from the brands master; the FE only displays this value
    pointName: z.string().openapi({
      example: 'ENJOYポイント',
      description:
        'Resolved from brands master (JOYFIT → ENJOYポイント / FIT365 → ベアレージポイント)',
    }),
    period: GetPointsPeriodSchema.openapi({
      example: 'all',
      description: 'Applied period filter',
    }),
    earnHistory: z.array(PointHistoryItemSchema).openapi({
      description: 'Earn history list',
    }),
    spendHistory: z.array(PointHistoryItemSchema).openapi({
      description: 'Spend history list',
    }),
    expiringPoints: z.number().int().nonnegative().openapi({
      example: 200,
      description: 'Points scheduled to expire',
    }),
    expiringAt: z.string().nullable().openapi({
      example: '2026-06-30',
      description: 'Expiry date of the expiring points (null if none)',
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
    changedAt: z.string().openapi({
      example: '2024-01-15T00:00:00+09:00',
      description: 'Change date and time',
    }),
    previousPlan: z.string().openapi({
      example: 'レギュラー会員',
      description: 'Previous main contract display name',
    }),
    newPlan: z.string().openapi({
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
    id: z.string().openapi({
      example: 'MC001',
      description: 'Main contract (plan) master ID',
    }),
    planName: z.string().openapi({
      example: 'スタンダードプラン',
      description: 'Plan name',
    }),
    monthlyFee: z.number().openapi({
      example: 8580,
      description: 'Monthly fee (tax included)',
    }),
    startDate: z.string().openapi({
      example: '2024-01-15',
      description: 'Contract start date',
    }),
    penaltyPeriodEnd: z.string().optional().openapi({
      example: '2025-01-14',
      description: 'Penalty period end date',
    }),
    changeHistory: z.array(ContractChangeSchema).openapi({
      description: 'Contract change history',
    }),
    // A-01 FR-013a: present while a plan change is awaiting the month-start application
    pendingPlanChange: MemberPendingPlanChangeSchema.optional().openapi({
      description: 'Pending main-contract change application',
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
  description:
    'Member main contract after registering the change application (the plan itself is unchanged until month start)',
});

export const CancelPlanChangeRequestSchema = z
  .object({
    application_id: z.string().min(1).openapi({
      example: 'ppc-001',
      description: 'Pending plan-change application id to cancel',
    }),
  })
  .openapi({
    title: 'CancelPlanChangeRequest',
    description: 'Request payload for cancelling a pending main-contract change application',
  });

export const CancelPlanChangeResponseSchema = MainContractSchema.openapi({
  title: 'CancelPlanChangeResponse',
  description: 'Member main contract after the pending change application was cancelled',
});

/**
 * Bulk main-contract (plan) change — A-01 FR-020.
 * Models POST /admin/members/bulk-plan-changes from the backend design doc
 * (member_ids + to_contract_id, applied from next-month start).
 */
export const BulkPlanChangeRequestSchema = z
  .object({
    member_ids: z
      .array(z.string().min(1))
      .min(1)
      .openapi({
        example: ['M-00001', 'M-00002'],
        description: 'Target member ids selected on the A-01 list',
      }),
    contract_id: z.string().min(1).openapi({
      example: 'MC005',
      description: 'Target main contract id (common to every target member)',
    }),
    // The client picks the apply-from date; the backend requires it and only
    // accepts the 1st of a month, from next month up to 12 months ahead
    // (backend design answer 2026-08-10, QA09 §2.1).
    effective_date: z.string().date().openapi({
      example: '2026-09-01',
      description: 'Apply-from date. Must be the 1st of a month, next month or later',
    }),
    // Optional since 2026-08-10: the backend dropped the required flag on both,
    // and the A-01 FR-020 dialog collects neither.
    fee_diff_handling: z.enum(['charge', 'waive', 'refund']).optional().openapi({
      example: 'charge',
      description: 'How to settle a pro-rata difference. Defaults to `charge`',
    }),
    reason: z.string().min(1).max(500).optional().openapi({
      example: '値上げ対応',
      description: 'Bulk change reason (audit trail)',
    }),
  })
  .openapi({
    title: 'BulkPlanChangeRequest',
    description: 'Request payload for the A-01 bulk main-contract change',
  });

/**
 * A bulk change is BOOKED, not applied: the job stays `pending` until the worker
 * runs at 00:00 on `effective_date`, so nothing changes on the member until then
 * and there is nothing to poll for (backend design answer 2026-08-10, QA09 §2.1).
 */
export const BulkPlanChangeResponseSchema = z
  .object({
    job_id: z.string().openapi({ example: 'bpc-20260901-001', description: 'Bulk job ID' }),
    status: z.literal('pending').openapi({
      description: 'Always `pending` on creation — the worker starts on the apply date',
    }),
    scheduled_count: z.number().int().openapi({
      example: 12,
      description: 'Number of members the change was booked for',
    }),
    effective_date: z.string().openapi({
      example: '2026-09-01',
      description: 'Apply-from date (first of a month)',
    }),
    contract_id: z.string().openapi({
      example: 'MC005',
      description: 'Target main contract id',
    }),
    contract_name: z.string().openapi({
      example: 'レギュラー会員（新料金）',
      description: 'Target main contract name',
    }),
  })
  .openapi({
    title: 'BulkPlanChangeResponse',
    description: 'Booking receipt for the A-01 bulk main-contract change',
  });

/** 409 body when some of the selected members already have a plan change booked. */
export const BulkPlanChangeConflictSchema = z
  .object({
    error: z.string().openapi({ example: 'Some members already have a pending plan change' }),
    code: z.literal('E-BPC-205'),
    details: z.object({
      conflicting_member_ids: z
        .array(z.string())
        .openapi({ description: 'Up to the first 100 conflicting member ids' }),
    }),
  })
  .openapi({
    title: 'BulkPlanChangeConflict',
    description: 'Conflict response for the A-01 bulk main-contract change',
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
    monthlyFee: z.number().openapi({
      example: 11000,
      description: 'Monthly fee',
    }),
    startDate: z.string().openapi({
      example: '2024-02-01',
      description: 'Start date',
    }),
    nextBillingDate: z.string().openapi({
      example: '2025-03-01',
      description: 'Next billing date',
    }),
    status: z.enum(['active', 'scheduled', 'cancel_scheduled']).optional().openapi({
      example: 'active',
      description:
        'Option status: active (適用中) / scheduled (翌月適用) / cancel_scheduled (解約予定)',
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
    apply_from: z.enum(['today', 'next_month', 'specific_date']).openapi({
      example: 'today',
      description:
        'When to start applying the option. `specific_date` is only valid for options whose master has 日割り (prorated_enabled) turned on, and requires `start_date`.',
    }),
    // A-01 FR-007: 月途中加入は日割り対応（日割り要否はオプションマスタ毎に設定）
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD')
      .optional()
      .openapi({
        example: '2026-07-15',
        description: 'Prorated start date (YYYY-MM-DD). Required when apply_from = specific_date.',
      }),
  })
  .refine((data) => data.apply_from !== 'specific_date' || !!data.start_date, {
    message: '開始日を選択してください',
    path: ['start_date'],
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
    removedOptionId: z.string().openapi({
      example: 'OP002',
      description: 'Removed option contract id',
    }),
    addedOption: OptionContractSchema.openapi({
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
    cancelledOptionId: z.string().openapi({
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
    id: z.string().openapi({
      example: 'CP001',
      description: 'Campaign application ID (stable key for the UI)',
    }),
    campaignName: z.string().openapi({
      example: '春の入会キャンペーン',
      description: 'Campaign name',
    }),
    periodStart: z.string().optional().openapi({
      example: '2025-03-01',
      description: 'Campaign period start date',
    }),
    periodEnd: z.string().optional().openapi({
      example: '2025-03-31',
      description: 'Campaign period end date',
    }),
    discountContent: z.string().optional().openapi({
      example: '入会金50%OFF',
      description: 'Discount content',
    }),
    remainingDays: z.number().optional().openapi({
      example: 15,
      description: 'Remaining days',
    }),
    appliedAt: z.string().optional().openapi({
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
    purchasedAt: z.string().openapi({
      example: '2025-03-10',
      description: 'Purchase date',
    }),
    storeName: z.string().openapi({
      example: 'JOYFIT渋谷店',
      description: 'Store used for the day pass',
    }),
    amount: z.number().openapi({ example: 1100, description: 'Purchase amount (tax included)' }),
    expiresAt: z.string().openapi({
      example: '2025-03-10',
      description: 'Expiry date of the day pass',
    }),
    // A-01 FR-019: full lifecycle per the API design doc (1Day / 1TimePass purchase history)
    status: z.enum(['active', 'pending_start', 'used', 'expired', 'cancelled']).openapi({
      title: 'DayPassStatus',
      example: 'used',
      description:
        'Day pass status: active (有効) / pending_start (開始前) / used (利用済み) / expired (期限切れ) / cancelled (キャンセル)',
    }),
  })
  .openapi({ title: 'DayPassRecord', description: 'Day pass purchase record' });

/**
 * Get Day Pass History Response Schema
 */
export const GetDayPassHistoryResponseSchema = z
  .object({
    dayPassHistory: z.array(DayPassRecordSchema).openapi({
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
    planName: z.string().nullable().openapi({
      example: 'レギュラー会員',
      description: 'Main contract plan name',
    }),
    totalMonthlyFee: z.number().openapi({
      example: 9680,
      description: 'Total monthly fee (main + options, tax included)',
    }),
    billingDay: z.number().int().min(1).max(31).nullable().openapi({
      example: 27,
      description: 'Billing day of month (kept for Phase 2 compatibility)',
    }),
    // The card renders the concrete next billing date; derived from billingDay server-side
    nextBillingDate: z.string().nullable().openapi({
      example: '2026-08-27',
      description: 'Next billing date, derived from billingDay',
    }),
    paymentMethod: z.enum(['credit_card', 'bank_transfer']).nullable().openapi({
      example: 'credit_card',
      description: 'Payment method',
    }),
    unpaidAmount: z.number().openapi({
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
    monthlyVisits: z.number().int().openapi({
      example: 12,
      description: 'Number of visits in the current month',
    }),
    monthlyVisitsDiff: z.number().int().openapi({
      example: 3,
      description: 'Difference in visits compared to the previous month',
    }),
    peakTimeSlot: z.string().nullable().openapi({
      example: '18:00-20:00',
      description: 'Most frequently used time slot',
    }),
    frequentStore: z.string().nullable().openapi({
      example: 'JOYFIT渋谷店',
      description: 'Most frequently visited store name',
    }),
    monthlyLessons: z.number().int().openapi({
      example: 12,
      description: 'Number of lesson reservations this month',
    }),
    monthlyLessonsDiff: z.number().int().openapi({
      example: 2,
      description: 'Difference in lesson reservations vs previous month',
    }),
    monthlyOptions: z.number().int().openapi({
      example: 5,
      description: 'Number of option usages this month',
    }),
    monthlyOptionsBreakdown: z
      .array(
        z.object({
          label: z.string().openapi({ example: '水素水' }),
          count: z.number().int().openapi({ example: 3 }),
        }),
      )
      .openapi({ description: 'Breakdown of option usage this month' }),
  })
  .openapi({
    title: 'GetUsageStatusResponse',
    description: 'Response for getting member usage status',
  });

/**
 * Get Training Records Request Schema
 */
export const TrainingRecordsPeriodSchema = z
  .enum(['all', 'this_month', 'last_3_months', 'last_1_year'])
  .openapi({
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
    mainContract: MainContractSchema.openapi({
      description: 'Main contract information',
    }),
    optionContracts: z.array(OptionContractSchema).openapi({
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
export type MemberBasicInfo = z.infer<typeof MemberBasicInfoSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type GetMembersQuery = z.infer<typeof GetMembersQuerySchema>;
export type GetMembersResponse = z.infer<typeof GetMembersResponseSchema>;
export type GetMembersSummaryResponse = z.infer<typeof GetMembersSummaryResponseSchema>;
export type GetMemberDetailResponse = z.infer<typeof GetMemberDetailResponseSchema>;
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
export type MemberPendingPlanChange = z.infer<typeof MemberPendingPlanChangeSchema>;
export type CancelPlanChangeRequest = z.infer<typeof CancelPlanChangeRequestSchema>;
export type CancelPlanChangeResponse = z.infer<typeof CancelPlanChangeResponseSchema>;
export type BulkPlanChangeRequest = z.infer<typeof BulkPlanChangeRequestSchema>;
export type BulkPlanChangeResponse = z.infer<typeof BulkPlanChangeResponseSchema>;
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
    id: z.string().openapi({
      description: 'Unique identifier of the payment history record',
      example: 'payment-history-M0001-0',
    }),
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
  .enum(['pending', 'confirmed', 'paid', 'uncollected', 'written-off'])
  .openapi({
    title: 'BillingStatus',
    description:
      'Billing status: pending (未確定), confirmed (確定), paid (入金済み), uncollected (未回収), written-off (貸倒)',
    example: 'paid',
  });

export const BillingTypeSchema = z.enum(['monthly', 'oneTime']).openapi({
  title: 'BillingType',
  description: 'Billing type: monthly (月次) or oneTime (都度)',
  example: 'monthly',
});

export const BillingItemSchema = z
  .object({
    id: z.string().openapi({
      description: 'Unique identifier of the billing record',
      example: 'billing-M0001-0',
    }),
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

export const PaymentPeriodSchema = z
  .enum(['all', 'thisMonth', 'lastMonth', '3months', '6months'])
  .openapi({
    title: 'PaymentPeriod',
    description: '入出金明細・支払いサマリー共通の期間フィルター',
  });

export type PaymentPeriod = z.infer<typeof PaymentPeriodSchema>;

export const PaymentSummarySchema = z
  .object({
    periodLabel: z.string().openapi({
      description: 'Display label of the summary period (e.g. 全期間 / 今月)',
      example: '全期間',
    }),
    totalSales: z.number().openapi({
      description: 'Total sales amount for the period in JPY',
      example: 118800,
    }),
    refundTotal: z.number().openapi({
      description: 'Total refund amount for the period in JPY',
      example: 0,
    }),
    netAmount: z.number().openapi({
      description: 'Net amount (sales - refund) in JPY',
      example: 118800,
    }),
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

/**
 * Authentication channel used at the gate.
 *
 * Single source of truth for the "認証方法" concept across the member-detail
 * screens. The values mirror the backend API design doc
 * (`Member_Activity_History_AuthChannel`: `qr` / `nfc` / `face` / `manual`),
 * which is also the vocabulary the shared B-01 入退館履歴 screen already uses
 * (`qr` / `nfc`). Japanese labels live in the UI layer
 * (`_constants/auth-method.ts`) — never store labels in the API payload.
 */
export const AccessAuthMethodSchema = z.enum(['qr', 'nfc', 'face', 'manual']).openapi({
  title: 'AccessAuthMethod',
  description: 'Gate authentication method (qr / nfc / face / manual)',
  example: 'qr',
});

/** Gate event type. One log row = one event (入館 or 退館), never a pair. */
export const AccessEventTypeSchema = z.enum(['entry', 'exit']).openapi({
  title: 'AccessEventType',
  description: 'Gate event type: entry (入館) or exit (退館)',
  example: 'entry',
});

export const EntryExitEventRowSchema = z
  .object({
    id: z.string().openapi({
      description: 'Entry/exit event ID',
      example: 'ee-001',
    }),
    occurredAt: z.string().openapi({
      description: 'Event timestamp in ISO8601 format',
      example: '2026-04-23T18:00:00Z',
    }),
    storeId: z.string().openapi({
      description: 'Store ID',
      example: 'store-001',
    }),
    storeName: z.string().openapi({
      description: 'Store name in Japanese',
      example: 'JOYFIT渋谷店',
    }),
    eventType: AccessEventTypeSchema,
    authMethod: AccessAuthMethodSchema,
  })
  .openapi({ title: 'EntryExitEventRow', description: 'A single gate entry or exit event' });

export const LessonReservationRowSchema = z
  .object({
    id: z.string().openapi({
      description: 'Lesson reservation ID',
      example: 'lr-001',
    }),
    lessonDate: z.string().openapi({
      description: 'Lesson date in YYYY-MM-DD format',
      example: '2026-04-23',
    }),
    lessonName: z.string().openapi({
      description: 'Lesson name in Japanese',
      example: 'ボクシング基礎',
    }),
    instructorName: z.string().openapi({
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
    authMethod: AccessAuthMethodSchema.openapi({
      description: 'Primary authentication method registered for the member',
    }),
    icCardNumber: z.string().nullable().openapi({
      description: 'IC card number, or null if not registered',
      example: 'IC-0001',
    }),
    qrCode: z.string().nullable().openapi({
      description: 'QR code identifier, or null if not registered',
      example: 'QR123456789',
    }),
    gateStop: z.boolean().openapi({
      description: 'Whether gate-stop is currently active',
      example: false,
    }),
  })
  .openapi({ title: 'MemberAccessSettings', description: 'Member access control settings' });

export const GetUsageHistoryEntriesResponseSchema = z
  .object({
    items: z.array(EntryExitEventRowSchema).openapi({
      description: 'Paginated entry/exit events, newest first',
    }),
    total: z.number().int().nonnegative().openapi({
      description: 'Total number of entry/exit events',
      example: 120,
    }),
    page: z.number().int().positive().openapi({
      description: 'Current page number (1-based)',
      example: 1,
    }),
    limit: z.number().int().positive().openapi({
      description: 'Number of records per page',
      example: 25,
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
      example: 25,
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
    re_enroll_month: z
      .string()
      .regex(YEAR_MONTH_PATTERN, 're_enroll_month must be YYYY-MM')
      .openapi({
        example: '2026-06',
        description: 'Re-enrollment month (YYYY-MM)',
      }),
    // The main-contract master ID, never the display name: plan names are editable and can
    // collide, so the ID is the only stable reference (same contract as ChangeMainContractRequest).
    plan_id: z.string().min(1).openapi({
      example: 'MC001',
      description: 'Selected main contract (plan) master ID',
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
    plan_id: z.string(),
    fee_waived: z.boolean(),
  })
  .openapi({
    title: 'ReEnrollResponse',
    description: 'Result of re-enrollment',
  });

export type ReEnrollRequest = z.infer<typeof ReEnrollRequestSchema>;
export type ReEnrollResponse = z.infer<typeof ReEnrollResponseSchema>;

export const DeletePersonalDataRequestSchema = z
  .object({
    reason: z
      .string({ message: '削除理由は必須です' })
      .trim()
      .min(1, '削除理由は必須です')
      .max(
        PERSONAL_DATA_DELETE_REASON_MAX_LENGTH,
        `削除理由は${PERSONAL_DATA_DELETE_REASON_MAX_LENGTH}文字以内で入力してください`,
      )
      .openapi({ example: '会員からの削除依頼', description: '削除理由（監査証跡）' }),
    confirmation: z
      .literal(PERSONAL_DATA_DELETE_CONFIRMATION, {
        message: '確認文字列が一致しません',
      })
      .openapi({
        description: `Typed confirmation — must be exactly ${PERSONAL_DATA_DELETE_CONFIRMATION}`,
      }),
  })
  .openapi({
    title: 'DeletePersonalDataRequest',
    description: 'Irreversibly replace a withdrawn member’s PII with dummy values',
  });

export type DeletePersonalDataRequest = z.infer<typeof DeletePersonalDataRequestSchema>;

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

// ===== 代理申請 (proxy application) — shared by 休会申請 / 退会申請 / 移籍申請 =====

/**
 * A-01 FR-017: the channel through which the member's agreement was obtained.
 * Labels shown to the operator stay Japanese (来店 / 電話 / メール / LINE); only the
 * enum key travels on the wire, matching the backend's `proxy_agreement_method`.
 */
export const ProxyAgreementMethodSchema = z.enum(['in_person', 'phone', 'email', 'line']).openapi({
  title: 'ProxyAgreementMethod',
  example: 'in_person',
  description:
    'Channel the member agreement was obtained through: in_person=来店, phone=電話, email=メール, line=LINE',
});

export type ProxyAgreementMethod = z.infer<typeof ProxyAgreementMethodSchema>;

/** Field set every 代理申請-capable request shares. Spread into the request object. */
export const proxyApplicationRequestFields = {
  is_proxy: z.boolean().openapi({
    example: false,
    description: 'Whether a staff member is submitting on behalf of the member',
  }),
  proxy_agreed_at: z.string().optional().openapi({
    example: '2026-05-19T03:00:00.000Z',
    description: 'Datetime of agreement (required when is_proxy is true)',
  }),
  proxy_method: ProxyAgreementMethodSchema.optional().openapi({
    description: 'Channel the agreement was obtained through (required when is_proxy is true)',
  }),
};

// ===== Withdraw =====

/**
 * A-01 FR-014: the withdrawal *type* is derived from the contract's usage start date,
 * never chosen by the operator — 入会取消 before usage begins, 通常退会 afterwards.
 * (The member's motivation is captured separately as free-text `reason`.)
 */
export const WithdrawalTypeSchema = z.enum(['normal', 'cancellation']).openapi({
  title: 'WithdrawalType',
  example: 'normal',
  description:
    'Derived withdrawal type: normal=通常退会, cancellation=入会取消 (before the contract usage start date)',
});

export type WithdrawalType = z.infer<typeof WithdrawalTypeSchema>;

export const WithdrawRequestSchema = z
  .object({
    scheduled_date: z.string().openapi({
      example: '2026-06-30',
      description: 'Scheduled withdrawal date (YYYY-MM-DD)',
    }),
    // A-01-01-b / FR-014: a single free-text field. The 6-value picklist this replaced
    // conflated the member's motivation with the withdrawal type, which is derived.
    reason: z
      .string({ message: '退会理由は必須です' })
      .min(1, '退会理由は必須です')
      .max(TEXTAREA_MAX_LENGTH)
      .openapi({
        example: '転居のため',
        description: 'Withdrawal reason (free text)',
      }),
    withdrawal_type: WithdrawalTypeSchema.openapi({
      description: 'Derived from the contract usage start date — not operator-selected',
    }),
    ...proxyApplicationRequestFields,
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

export const WithdrawCancelRequestSchema = z
  .object({
    // A-01 FR-005 取り消し事由 — optional, recorded on the change-history row for audit
    comment: z.string().trim().max(TEXTAREA_MAX_LENGTH).optional().openapi({
      example: '会員から継続の申し出があったため',
      description: '取り消し事由（任意）',
    }),
  })
  .openapi({
    title: 'WithdrawCancelRequest',
    description: 'Cancel a scheduled withdrawal',
  });

export type WithdrawCancelRequest = z.infer<typeof WithdrawCancelRequestSchema>;

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
    pattern: GateStopPatternSchema.openapi({
      description: 'Gate stop pattern',
    }),
    reasonCategory: z.enum(['nuisance', 'unpaid', 'fraudulent_use', 'other']).openapi({
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

// GateStopPatternSchema is defined above because it is shared with MemberGateStopBundleSchema

/**
 * Patterns that can actually be SET. `always_open` is excluded on purpose: it is
 * the absence of a gate stop, so choosing it means releasing, and the server
 * rejects it here (backend design answer 2026-08-10, QA03 §2.2).
 */
export const GateStopSetPatternSchema = z
  .enum(['staffed_hours_deny', 'always_deny', 'unstaffed_hours_deny'])
  .openapi({
    title: 'GateStopSetPattern',
    example: 'always_deny',
    description: 'Gate stop pattern to set. `always_open` belongs to the release endpoint',
  });

export const GateStopRequestSchema = z
  .object({
    pattern: GateStopSetPatternSchema.openapi({ description: 'Gate stop pattern' }),
    reasonCategory: GateStopReasonSchema.openapi({ description: 'Reason for gate stop' }),
    messageType: z.enum(['allow_after_confirm', 'deny_after_confirm']).openapi({
      example: 'deny_after_confirm',
      description: 'Whether entry is still denied after the member confirms the gate message',
    }),
    message: z.string().min(1).max(500).optional().openapi({
      example: 'スタッフにお声がけください',
      description: 'Message to display on the gate terminal (optional)',
    }),
    // No `scope` / `storeId`: a gate stop always applies to every store, and the
    // server records the setter's own store for audit.
  })
  .openapi({
    title: 'GateStopRequest',
    description: 'Request body for setting gate stop on a member',
  });

export const GateStopResponseSchema = z
  .object({
    success: z.boolean(),
    member_id: z.string(),
    pattern: GateStopSetPatternSchema,
    reasonCategory: GateStopReasonSchema,
  })
  .openapi({
    title: 'GateStopResponse',
    description: 'Result of gate stop setting',
  });

export type GateStopReason = z.infer<typeof GateStopReasonSchema>;
export type GateStopPattern = z.infer<typeof GateStopPatternSchema>;
export type GateStopSetPattern = z.infer<typeof GateStopSetPatternSchema>;
export type MemberFamilyBundle = z.infer<typeof MemberFamilyBundleSchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type NotificationTopic = z.infer<typeof NotificationTopicSchema>;
export type GateStopRequest = z.infer<typeof GateStopRequestSchema>;
export type GateStopResponse = z.infer<typeof GateStopResponseSchema>;

// ===== Gate Stop Release =====

export const GateStopReleaseReasonSchema = z
  .enum(['resolved', 'misconfigured', 'identity_verified', 'other'])
  .openapi({
    title: 'GateStopReleaseReason',
    description:
      'Reason for releasing gate stop: resolved=問題解決済み, misconfigured=誤設定, identity_verified=本人確認完了, other=その他',
  });

export const GateStopReleaseRequestSchema = z
  .object({
    reasonCategory: GateStopReleaseReasonSchema.openapi({
      description: 'Reason for releasing gate stop',
    }),
    note: z.string().min(1).max(500).optional().openapi({
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
    gateStop: z.null().openapi({ description: 'Always null — the stop no longer exists' }),
    clearedAt: z.string().openapi({ example: '2026-06-17T14:20:00.000Z' }),
    clearedBy: StaffRefSchema.openapi({ description: 'Staff who released the gate stop' }),
    clearedReasonCategory: GateStopReleaseReasonSchema,
    clearedNote: z
      .string()
      .nullable()
      .openapi({ description: 'Free-text detail, null if omitted' }),
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
    start_month: z.string().regex(YEAR_MONTH_PATTERN, 'start_month must be YYYY-MM').openapi({
      example: '2026-07',
      description: 'Suspension start month (YYYY-MM)',
    }),
    end_month: z.string().regex(YEAR_MONTH_PATTERN, 'end_month must be YYYY-MM').openapi({
      example: '2026-09',
      description: 'Suspension end month (YYYY-MM)',
    }),
    reason: z.string().optional().openapi({
      example: '産前産後のため',
      description: 'Reason for suspension (optional)',
    }),
    // A-01 FR-S001: manual refund of the point discount (Manager+). A refund reason is required
    return_points: z.boolean().optional().openapi({
      example: false,
      description: 'Whether to refund the point-based discount applied to this member',
    }),
    return_reason: z.string().optional().openapi({
      example: '休会期間中のポイント値引き分を返還',
      description: 'Reason for the point refund (required when return_points is true)',
    }),
    ...proxyApplicationRequestFields,
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
    resume_month: z.string().regex(YEAR_MONTH_PATTERN, 'resume_month must be YYYY-MM').openapi({
      example: '2026-07',
      description: 'Month from which billing resumes (YYYY-MM)',
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
    reason: z.string().max(TEXTAREA_MAX_LENGTH).optional().openapi({
      example: '転居のため',
      // R-5: free text on purpose. The backend's 6-value `reasonCode` is a derived
      // mapping applied at the Phase 2 boundary, not an operator choice.
      description: '移籍理由（任意・自由記述）',
    }),
    ...proxyApplicationRequestFields,
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

export type AccessAuthMethod = z.infer<typeof AccessAuthMethodSchema>;
export type AccessEventType = z.infer<typeof AccessEventTypeSchema>;
export type EntryExitEventRow = z.infer<typeof EntryExitEventRowSchema>;
export type LessonReservationRow = z.infer<typeof LessonReservationRowSchema>;
export type MemberAccessSettings = z.infer<typeof MemberAccessSettingsSchema>;
export type GetUsageHistoryEntriesResponse = z.infer<typeof GetUsageHistoryEntriesResponseSchema>;
export type GetUsageHistoryLessonsResponse = z.infer<typeof GetUsageHistoryLessonsResponseSchema>;
export type GetUsageHistoryAccessSettingsResponse = z.infer<
  typeof GetUsageHistoryAccessSettingsResponseSchema
>;
export type GetUsageHistoryStoresResponse = z.infer<typeof GetUsageHistoryStoresResponseSchema>;

// ─── Referrals (紹介関係) — GET /crm/members/{id}/referrals ────────────────
export const ReferralInviteeSchema = z
  .object({
    memberId: z.string().openapi({ example: 'M-00021' }),
    memberNumber: z.string().openapi({ example: 'M-00021' }),
    displayName: z.string().openapi({ example: '田中 一郎' }),
    joinedAt: z.string().openapi({ example: '2026-02-10', description: 'Join date' }),
    rewardGranted: z
      .boolean()
      .openapi({ example: true, description: 'Whether referral reward granted' }),
  })
  .openapi({ title: 'ReferralInvitee', description: 'A member invited by this member' });

export const GetReferralsResponseSchema = z
  .object({
    inboundFlag: z.boolean().openapi({ example: true, description: 'Joined via referral' }),
    referrer: MemberRefSchema.nullable().openapi({ description: 'Referrer member (null if none)' }),
    invitees: z
      .array(ReferralInviteeSchema)
      .openapi({ description: 'Members invited by this member' }),
    stats: z
      .object({
        totalReferred: z.number().int().openapi({ example: 3 }),
        rewardGrantedCount: z.number().int().openapi({ example: 2 }),
        rewardPendingCount: z.number().int().openapi({ example: 1 }),
      })
      .openapi({ description: 'Referral statistics' }),
  })
  .openapi({ title: 'GetReferralsResponse', description: 'Member referral relationships' });
export type GetReferralsResponse = z.infer<typeof GetReferralsResponseSchema>;

// ─── Individual fee adjustments (個別会費調整) ─────────────────────────────
export const FeeAdjustmentPatternSchema = z
  .enum(['amount', 'discount_amount', 'discount_rate', 'markup_amount'])
  .openapi({
    title: 'FeeAdjustmentPattern',
    description:
      'amount=金額指定, discount_amount=値引き額指定, discount_rate=割引率指定, markup_amount=値増し額指定',
  });

export const FeeAdjustmentStatusSchema = z
  .enum(['active', 'scheduled', 'ended'])
  .openapi({ title: 'FeeAdjustmentStatus', description: '適用中 / 適用予定 / 終了' });

export const FeeAdjustmentItemSchema = z
  .object({
    id: z.string().openapi({ example: 'fa-001' }),
    // Always full calendar dates (YYYY-MM-DD): the period is stored as first day of the
    // start month .. last day of the end month, even though the UI only picks months.
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .openapi({ example: '2026-05-01', description: 'Start date (YYYY-MM-DD)' }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .openapi({ example: '2026-08-31', description: 'End date (YYYY-MM-DD)' }),
    pattern: FeeAdjustmentPatternSchema,
    value: z
      .number()
      .openapi({ example: 1000, description: 'Amount or rate depending on pattern' }),
    reason: z.string().nullable().openapi({ example: '長期利用割引' }),
    setBy: z.string().openapi({ example: '管理者A', description: 'Staff who set the adjustment' }),
    status: FeeAdjustmentStatusSchema,
  })
  .openapi({ title: 'FeeAdjustmentItem', description: 'A single fee-adjustment record' });

export const GetFeeAdjustmentsResponseSchema = z
  .object({ items: z.array(FeeAdjustmentItemSchema) })
  .openapi({ title: 'GetFeeAdjustmentsResponse', description: 'Member fee-adjustment history' });
export type GetFeeAdjustmentsResponse = z.infer<typeof GetFeeAdjustmentsResponseSchema>;

export const AddFeeAdjustmentRequestSchema = z
  .object({
    // A-01 FR-006: period-bound ("from when", "until when", "how much"). Months are `YYYY-MM`.
    start_month: z
      .string()
      .regex(YEAR_MONTH_PATTERN, 'start_month must be YYYY-MM')
      .openapi({ example: '2026-07' }),
    end_month: z
      .string()
      .regex(YEAR_MONTH_PATTERN, 'end_month must be YYYY-MM')
      .openapi({ example: '2026-12' }),
    pattern: FeeAdjustmentPatternSchema,
    value: z.number().openapi({ example: 1000 }),
    // A-01 FR-006: "adjustment reason input is mandatory (audit trail)"
    reason: z.string().min(1).openapi({ example: '長期利用割引' }),
    is_proxy: z.boolean().default(false),
    proxy_agreed_at: z.string().optional(),
    proxy_method: z.string().optional(),
  })
  .openapi({ title: 'AddFeeAdjustmentRequest', description: 'Add an individual fee adjustment' });
export const AddFeeAdjustmentResponseSchema = FeeAdjustmentItemSchema.openapi({
  title: 'AddFeeAdjustmentResponse',
});
export type AddFeeAdjustmentRequest = z.infer<typeof AddFeeAdjustmentRequestSchema>;
export type AddFeeAdjustmentResponse = z.infer<typeof AddFeeAdjustmentResponseSchema>;

// ─── Blacklist registration (ブラックリスト登録) — POST ───────────────────
export const RegisterBlacklistRequestSchema = z
  .object({
    reason: GateStopReasonSchema.openapi({ description: 'Blacklist reason' }),
    memo: z
      .string()
      .optional()
      .openapi({ example: '店内での迷惑行為', description: 'Optional memo' }),
  })
  .openapi({
    title: 'RegisterBlacklistRequest',
    description: 'Register a member to the blacklist',
  });
export const RegisterBlacklistResponseSchema = z
  .object({ success: z.boolean(), member_id: z.string(), blacklist_id: z.string() })
  .openapi({ title: 'RegisterBlacklistResponse' });
export type RegisterBlacklistRequest = z.infer<typeof RegisterBlacklistRequestSchema>;
export type RegisterBlacklistResponse = z.infer<typeof RegisterBlacklistResponseSchema>;

// ─── Survey responses (アンケート回答) — GET ──────────────────────────────
// The type shares the survey master's value set (survey.schema.ts); reused so the values never drift.
export const SurveyResponseTypeSchema = SurveyTemplateTypeSchema.openapi({
  title: 'SurveyResponseType',
  description: 'ライフサイクル / オペレーション',
});

export const SurveyResponseItemSchema = z
  .object({
    id: z.string().openapi({ example: 'R-001', description: 'アンケート回答ID' }),
    surveyName: z.string().openapi({ example: '入会時アンケート' }),
    surveyType: SurveyResponseTypeSchema,
    // Returned in the same yyyy/MM/dd HH:mm format as the survey-response list (survey-reporting)
    responseDate: z
      .string()
      .openapi({ example: '2026/03/10 14:32', description: '回答日時 (yyyy/MM/dd HH:mm)' }),
  })
  .openapi({ title: 'SurveyResponseItem', description: 'A single survey response summary' });

export const GetSurveyResponsesResponseSchema = z
  .object({ items: z.array(SurveyResponseItemSchema) })
  .openapi({ title: 'GetSurveyResponsesResponse', description: 'Member survey response history' });
export type GetSurveyResponsesResponse = z.infer<typeof GetSurveyResponsesResponseSchema>;

// Notification settings used to live on their own endpoint, keyed by channel
// (push / in-app / mail / SMS). They are now part of the member detail response
// and keyed by TOPIC — see `NotificationPreferenceSchema` above
// (backend design answer 2026-08-10, QA02 §2.3).

// ─── Option usage history (オプション利用履歴) — GET, paginated ────────────
export const OptionUsageItemSchema = z
  .object({
    id: z.string().openapi({ example: 'ou-001' }),
    date: z.string().openapi({ example: '2026-04-20', description: 'Usage date' }),
    storeName: z.string().openapi({ example: 'JOYFIT渋谷店' }),
    optionName: z.string().openapi({ example: 'パーソナルトレーニング' }),
    count: z.number().int().openapi({ example: 1, description: 'Usage count' }),
  })
  .openapi({ title: 'OptionUsageItem', description: 'A single option-usage record' });

export const GetOptionUsageResponseSchema = z
  .object({
    items: z.array(OptionUsageItemSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  })
  .openapi({ title: 'GetOptionUsageResponse', description: 'Paginated option-usage history' });
export type GetOptionUsageResponse = z.infer<typeof GetOptionUsageResponseSchema>;

// ─── Change history (変更履歴) — GET, 5-source union per doc ───────────────
export const ChangeHistorySourceSchema = z
  .enum([
    'member',
    'option_contract',
    'contract_status',
    'plan_change_application',
    'transfer_application',
  ])
  .openapi({ title: 'ChangeHistorySource' });

export const ChangeHistoryFieldChangeSchema = z
  .object({
    field: z.string().openapi({ example: 'ステータス', description: 'Changed field label' }),
    // Machine-readable code, separate from the display label (field). The FE branches on this
    // code so changing the label wording does not break badges etc.
    fieldCode: z
      .enum(['status', 'name', 'address', 'phone', 'email', 'contract', 'option', 'other'])
      .openapi({ example: 'status', description: 'Machine-readable field code' }),
    before: z.string().nullable().openapi({ example: '有効' }),
    after: z.string().nullable().openapi({ example: '休会中' }),
  })
  .openapi({ title: 'ChangeHistoryFieldChange' });

export const ChangeHistoryItemSchema = z
  .object({
    id: z.string().openapi({ example: 'ch-001' }),
    source: ChangeHistorySourceSchema,
    changedAt: z.string().openapi({ example: '2026-04-01T10:00:00.000Z' }),
    action: z.string().openapi({ example: 'ステータス変更', description: 'Action label' }),
    operatorName: z
      .string()
      .openapi({ example: '山田 花子', description: 'Operator display name' }),
    operatorType: z
      .enum(['staff', 'member', 'system'])
      .openapi({ example: 'staff', description: 'Operator type' }),
    changes: z
      .array(ChangeHistoryFieldChangeSchema)
      .openapi({ description: 'Field-level changes' }),
  })
  .openapi({ title: 'ChangeHistoryItem', description: 'A single change-history entry' });

export const GetChangeHistoryResponseSchema = z
  .object({
    items: z.array(ChangeHistoryItemSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  })
  .openapi({ title: 'GetChangeHistoryResponse', description: 'Paginated member change history' });
export type GetChangeHistoryResponse = z.infer<typeof GetChangeHistoryResponseSchema>;

// ─── Reservation penalty release (予約ペナルティ解除) — POST ───────────────
export const PenaltyReleaseRequestSchema = z
  .object({
    reason: z
      .enum(['issue_resolved', 'wrong_setting', 'special_case', 'other'])
      .openapi({ description: 'Release reason' }),
    detail: z.string().optional().openapi({ example: '会員と確認済み' }),
  })
  .openapi({
    title: 'PenaltyReleaseRequest',
    description: 'Release an active reservation penalty',
  });
export const PenaltyReleaseResponseSchema = z
  .object({ success: z.boolean(), member_id: z.string() })
  .openapi({ title: 'PenaltyReleaseResponse' });
export type PenaltyReleaseRequest = z.infer<typeof PenaltyReleaseRequestSchema>;
export type PenaltyReleaseResponse = z.infer<typeof PenaltyReleaseResponseSchema>;

// ─── Suspension / withdrawal history strip (休会・退会履歴) — GET ──────────
export const SuspensionHistoryItemSchema = z
  .object({
    id: z.string().openapi({ example: 'sh-001' }),
    type: z
      .enum(['suspension', 'withdrawal_scheduled'])
      .openapi({ description: '休会 / 退会予定' }),
    status: z
      .enum(['active', 'pending', 'ended', 'cancelled'])
      .openapi({ description: '適用中 / 申請中 / 終了 / 取消' }),
    startMonth: z.string().openapi({ example: '2026-07' }),
    endMonth: z.string().nullable().openapi({ example: '2026-09' }),
  })
  .openapi({ title: 'SuspensionHistoryItem' });

export const GetSuspensionHistoryResponseSchema = z
  .object({ items: z.array(SuspensionHistoryItemSchema) })
  .openapi({
    title: 'GetSuspensionHistoryResponse',
    description: 'Suspension / withdrawal history',
  });
export type GetSuspensionHistoryResponse = z.infer<typeof GetSuspensionHistoryResponseSchema>;

// ─── Member-detail bundle sub-schema type exports ─────────────────────────
export type MemberPersonalInfo = z.infer<typeof MemberPersonalInfoSchema>;
export type MemberPrimaryStore = z.infer<typeof MemberPrimaryStoreSchema>;
export type MemberCurrentMainContract = z.infer<typeof MemberCurrentMainContractSchema>;
export type MemberGateStopBundle = z.infer<typeof MemberGateStopBundleSchema>;
export type MemberBlacklistBundle = z.infer<typeof MemberBlacklistBundleSchema>;
export type MemberLinking = z.infer<typeof MemberLinkingSchema>;
export type MemberReferralBundle = z.infer<typeof MemberReferralBundleSchema>;
export type MemberActivePenalty = z.infer<typeof MemberActivePenaltySchema>;
export type MemberConstraints = z.infer<typeof MemberConstraintsSchema>;
export type FeeAdjustmentItem = z.infer<typeof FeeAdjustmentItemSchema>;
export type FeeAdjustmentPattern = z.infer<typeof FeeAdjustmentPatternSchema>;
export type FeeAdjustmentStatus = z.infer<typeof FeeAdjustmentStatusSchema>;
export type ReferralInvitee = z.infer<typeof ReferralInviteeSchema>;
export type SurveyResponseItem = z.infer<typeof SurveyResponseItemSchema>;
export type SurveyResponseType = z.infer<typeof SurveyResponseTypeSchema>;
export type OptionUsageItem = z.infer<typeof OptionUsageItemSchema>;
export type ChangeHistoryItem = z.infer<typeof ChangeHistoryItemSchema>;
export type ChangeHistoryFieldChange = z.infer<typeof ChangeHistoryFieldChangeSchema>;
export type SuspensionHistoryItem = z.infer<typeof SuspensionHistoryItemSchema>;
