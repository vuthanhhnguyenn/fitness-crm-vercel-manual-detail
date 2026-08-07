import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const OptionalDateInputSchema = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) return null;
  return value;
}, z.string().regex(DATE_REGEX).nullable());

const OptionalTextSchema = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) return null;
  return value;
}, z.string().max(1000).nullable());

const OptionalDisplayOrderInputSchema = z.preprocess((value) => {
  if (value === '' || value === undefined || value === null) return null;
  if (typeof value === 'number') return String(value);
  return value;
}, z.string().trim().nullable());

export const InternalTermsTypeSchema = z
  .enum(['membership', 'privacy', 'payment', 'companion', 'withdrawal', 'suspension'])
  .openapi({ title: 'InternalTermsType', example: 'membership' });

export const TermsStatusSchema = z
  .enum(['published', 'expired', 'draft'])
  .openapi({ title: 'TermsStatus', example: 'published' });

export const TermsVersionStatusSchema = z
  .enum(['active', 'expired', 'draft'])
  .openapi({ title: 'TermsVersionStatus', example: 'active' });

export const BrandLabelSchema = z.enum(['JOYFIT', 'FIT365']).openapi({
  title: 'BrandLabel',
  example: 'JOYFIT',
});

export const VersionTypeSchema = z
  .enum(['original', 'version'])
  .openapi({ title: 'VersionType', example: 'version' });

export const TermsConsentSourceSchema = z.string().min(1).openapi({
  title: 'TermsConsentSource',
  example: 'app_launch',
});

export const TermsFileSchema = z
  .object({
    name: z.string().min(1),
    size: z.string().min(1),
    url: z.string().nullable(),
  })
  .openapi({ title: 'TermsFile' });

export const VersionHistoryItemSchema = z
  .object({
    version: z.string().min(1).max(50),
    versionType: VersionTypeSchema,
    date: z.string().min(1),
    period: z.string().min(1),
    summary: z.string().min(1),
    status: TermsVersionStatusSchema,
    file: TermsFileSchema,
  })
  .openapi({ title: 'VersionHistoryItem' });

export const TermsConsentRecordSchema = z
  .object({
    consentId: z.string().min(1),
    memberId: z.string().min(1),
    termsId: z.string().min(1),
    source: TermsConsentSourceSchema,
    consentedAt: z.string().min(1),
  })
  .openapi({ title: 'TermsConsentRecord' });

export const TermsDocumentSchema = z
  .object({
    id: z.string().min(1),
    parentTermsId: z.string().nullable(),
    prevTermsId: z.string().nullable(),
    termsType: InternalTermsTypeSchema,
    brandEnum: BrandLabelSchema,
    title: z.string().min(1).max(255),
    version: z.string().min(1).max(50),
    pdfS3Key: z.string().min(1),
    pdfUrl: z.string().nullable(),
    pdfFileName: z.string().nullable().optional(),
    bodyText: z.string().nullable().optional(),
    effectiveFrom: z.string().regex(DATE_REGEX),
    effectiveTo: z.string().regex(DATE_REGEX).nullable(),
    displayOrder: z.number().int().min(0).nullable(),
    requiresConsent: z.boolean(),
    remarks: z.string().max(1000).nullable(),
    isActive: z.boolean(),
    createdBy: z.string().nullable(),
    updatedBy: z.string().min(1),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    deletedAt: z.string().nullable(),
  })
  .openapi({ title: 'TermsDocument' });

export const CreateTermsBodySchema = z
  .object({
    brandEnum: BrandLabelSchema,
    termsType: InternalTermsTypeSchema,
    title: z.string().trim().min(1).max(255),
    version: z.string().trim().min(1).max(50),
    effectiveFrom: z.string().regex(DATE_REGEX),
    effectiveTo: OptionalDateInputSchema.optional(),
    displayOrder: OptionalDisplayOrderInputSchema.optional(),
    requiresConsent: z.boolean(),
    remarks: OptionalTextSchema.optional(),
    pdfS3Key: z.string().trim().min(1),
    pdfUrl: z.string().nullable().optional(),
    pdfFileName: z.string().trim().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveTo'],
        message: 'effectiveTo must be greater than or equal to effectiveFrom',
      });
    }
  })
  .openapi({ title: 'CreateTermsBody' });

export const UpdateTermsBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    version: z.string().trim().min(1).max(50).optional(),
    effectiveFrom: z.string().regex(DATE_REGEX).optional(),
    effectiveTo: OptionalDateInputSchema.optional(),
    displayOrder: OptionalDisplayOrderInputSchema.optional(),
    requiresConsent: z.boolean().optional(),
    remarks: OptionalTextSchema.optional(),
    pdfS3Key: z.string().trim().min(1).optional(),
    pdfUrl: z.string().nullable().optional(),
    pdfFileName: z.string().trim().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.effectiveFrom && data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveTo'],
        message: 'effectiveTo must be greater than or equal to effectiveFrom',
      });
    }
  })
  .openapi({ title: 'UpdateTermsBody' });

export const CreateTermsVersionBodySchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    version: z.string().trim().min(1).max(50),
    effectiveFrom: z.string().regex(DATE_REGEX),
    effectiveTo: OptionalDateInputSchema.optional(),
    displayOrder: OptionalDisplayOrderInputSchema.optional(),
    requiresConsent: z.boolean(),
    remarks: OptionalTextSchema.optional(),
    pdfS3Key: z.string().trim().min(1),
    pdfUrl: z.string().nullable().optional(),
    pdfFileName: z.string().trim().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveTo'],
        message: 'effectiveTo must be greater than or equal to effectiveFrom',
      });
    }
  })
  .openapi({ title: 'CreateTermsVersionBody' });

export const TermsListSortSchema = z
  .enum(['displayOrder', 'effectiveFrom', 'createdAt'])
  .openapi({ title: 'TermsListSort', example: 'displayOrder' });

export const TermsListOrderSchema = z
  .enum(['asc', 'desc'])
  .openapi({ title: 'TermsListOrder', example: 'asc' });

export const TermsListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: TermsListSortSchema.default('displayOrder'),
    order: TermsListOrderSchema.default('asc'),
    search: z.string().trim().max(100).optional(),
    status: TermsStatusSchema.optional(),
    termsType: InternalTermsTypeSchema.optional(),
    brandEnum: BrandLabelSchema.optional(),
    includeDeleted: z
      .preprocess((value) => {
        if (value === undefined || value === null || value === '') return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value === 'true';
        return false;
      }, z.boolean())
      .default(false),
  })
  .openapi({ title: 'TermsListQuery' });

export const TermsListItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(255),
    termsType: InternalTermsTypeSchema,
    version: z.string().min(1).max(50),
    brandEnum: BrandLabelSchema,
    effectiveFrom: z.string().regex(DATE_REGEX),
    effectiveTo: z.string().regex(DATE_REGEX).nullable(),
    displayOrder: z.number().int().min(0).nullable(),
    requiresConsent: z.boolean(),
    remarks: z.string().max(1000).nullable(),
    status: TermsStatusSchema,
    isDeleted: z.boolean(),
  })
  .openapi({ title: 'TermsListItem' });

export const TermsListResponseSchema = z
  .object({
    items: z.array(TermsListItemSchema),
    totalAllItems: z.number().int().min(0),
    pagination: z.object({
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      totalItems: z.number().int().min(0),
      totalPages: z.number().int().min(1),
    }),
  })
  .openapi({ title: 'TermsListResponse' });

export const TermsDetailSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(255),
    termsType: InternalTermsTypeSchema,
    brandEnum: BrandLabelSchema,
    status: TermsStatusSchema,
    currentVersion: z.string().min(1).max(50),
    effectiveFrom: z.string().regex(DATE_REGEX),
    effectiveTo: z.string().regex(DATE_REGEX).nullable(),
    displayOrder: z.number().int().min(0).nullable(),
    requiresConsent: z.boolean(),
    remarks: z.string().max(1000).nullable(),
    bodyText: z.string().nullable().optional(),
    currentFile: TermsFileSchema,
    versions: z.array(VersionHistoryItemSchema),
    createdBy: z.string().nullable(),
    updatedBy: z.string().min(1),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    isDeleted: z.boolean(),
  })
  .openapi({ title: 'TermsDetail' });

export const ProcedurePurposeSchema = z
  .enum(['app_launch', 'withdrawal', 'suspension'])
  .openapi({ title: 'ProcedurePurpose', example: 'app_launch' });

export const GetActiveTermsQuerySchema = z
  .object({
    brand: BrandLabelSchema,
    purpose: ProcedurePurposeSchema.optional(),
    memberId: z.string().optional(),
  })
  .openapi({ title: 'GetActiveTermsQuery' });

export const ActiveTermsItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(255),
    version: z.string().min(1).max(50),
    pdfUrl: z.string().nullable(),
    requiresConsent: z.boolean(),
  })
  .openapi({ title: 'ActiveTermsItem' });

export const ActiveTermsResponseSchema = z
  .object({
    items: z.array(ActiveTermsItemSchema),
  })
  .openapi({ title: 'ActiveTermsResponse' });

export const RecordTermsConsentBodySchema = z
  .object({
    memberId: z.string().min(1),
    termsIds: z.array(z.string().min(1)).min(1),
    source: TermsConsentSourceSchema,
  })
  .openapi({ title: 'RecordTermsConsentBody' });

export const RecordTermsConsentResponseSchema = z
  .object({
    recorded: z.number().int().min(0),
  })
  .openapi({ title: 'RecordTermsConsentResponse' });

export const DeleteTermsResponseSchema = z
  .object({
    message: z.string().openapi({ example: '規約を削除しました' }),
  })
  .openapi({ title: 'DeleteTermsResponse' });

export const TermsErrorResponseSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    userMessage: z.string(),
    traceId: z.string().nullable(),
  })
  .openapi({ title: 'TermsErrorResponse' });

export type InternalTermsType = z.infer<typeof InternalTermsTypeSchema>;
export type TermsStatus = z.infer<typeof TermsStatusSchema>;
export type TermsVersionStatus = z.infer<typeof TermsVersionStatusSchema>;
export type BrandLabel = z.infer<typeof BrandLabelSchema>;
export type VersionType = z.infer<typeof VersionTypeSchema>;
export type TermsFile = z.infer<typeof TermsFileSchema>;
export type VersionHistoryItem = z.infer<typeof VersionHistoryItemSchema>;
export type TermsConsentRecord = z.infer<typeof TermsConsentRecordSchema>;
export type TermsDocument = z.infer<typeof TermsDocumentSchema>;
export type CreateTermsBody = z.infer<typeof CreateTermsBodySchema>;
export type UpdateTermsBody = z.infer<typeof UpdateTermsBodySchema>;
export type CreateTermsVersionBody = z.infer<typeof CreateTermsVersionBodySchema>;
export type TermsListSort = z.infer<typeof TermsListSortSchema>;
export type TermsListOrder = z.infer<typeof TermsListOrderSchema>;
export type TermsListQuery = z.infer<typeof TermsListQuerySchema>;
export type TermsListItem = z.infer<typeof TermsListItemSchema>;
export type TermsListResponse = z.infer<typeof TermsListResponseSchema>;
export type TermsDetail = z.infer<typeof TermsDetailSchema>;
export type ProcedurePurpose = z.infer<typeof ProcedurePurposeSchema>;
export type GetActiveTermsQuery = z.infer<typeof GetActiveTermsQuerySchema>;
export type ActiveTermsItem = z.infer<typeof ActiveTermsItemSchema>;
export type ActiveTermsResponse = z.infer<typeof ActiveTermsResponseSchema>;
export type RecordTermsConsentBody = z.infer<typeof RecordTermsConsentBodySchema>;
export type RecordTermsConsentResponse = z.infer<typeof RecordTermsConsentResponseSchema>;
export type DeleteTermsResponse = z.infer<typeof DeleteTermsResponseSchema>;

export const TERMS_TYPE_LABELS: Record<InternalTermsType, string> = {
  membership: '会員規約',
  privacy: 'プライバシーポリシー',
  payment: '決済規約',
  companion: '同伴規約',
  withdrawal: '退会規約',
  suspension: '休会規約',
};

export const TERMS_STATUS_LABELS: Record<TermsStatus, string> = {
  published: '公開中',
  expired: '適用終了',
  draft: '下書き',
};

export const TERMS_VERSION_STATUS_LABELS: Record<TermsVersionStatus, string> = {
  active: '適用中',
  expired: '適用終了',
  draft: '下書き',
};

export const VERSION_TYPE_LABELS: Record<VersionType, string> = {
  original: 'オリジナル規約',
  version: 'バージョン規約',
};
