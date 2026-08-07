import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

import { BRAND_OPTIONS, TERMS_TYPE_OPTIONS } from '../_constants/constants';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type TermsFormMode = 'create' | 'edit' | 'new-version';
const BrandInputSchema = z.array(z.enum(BRAND_OPTIONS)).min(1, 'ブランドを選択してください。');
const TermsTypeInputSchema = z.union([z.enum(TERMS_TYPE_OPTIONS), z.literal('')]);

export const TermsFormSchema = z
  .object({
    brandEnum: BrandInputSchema,
    title: z
      .string()
      .trim()
      .min(1, '規約名を入力してください。')
      .max(TEXT_MAX_LENGTH, `規約名は${TEXT_MAX_LENGTH}文字以内で入力してください。`),
    termsType: TermsTypeInputSchema,
    version: z
      .string()
      .trim()
      .min(1, 'バージョンを入力してください。')
      .max(50, 'バージョンは50文字以内で入力してください。'),
    effectiveFrom: z.string().regex(DATE_PATTERN, '適用開始日を入力してください。'),
    effectiveTo: z.string().regex(DATE_PATTERN).nullable(),
    displayOrder: z
      .number()
      .int('表示順は1以上の整数で入力してください。')
      .min(1, '表示順は1以上の整数で入力してください。')
      .nullable(),
    requiresConsent: z.boolean(),
    remarks: z
      .string()
      .max(TEXTAREA_MAX_LENGTH, `備考は${TEXTAREA_MAX_LENGTH}文字以内で入力してください。`)
      .nullable(),
    pdfUrl: z.string().min(1, 'PDFファイルを選択してください。'),
    pdfFileName: z.string().min(1, 'PDFファイルを選択してください。').max(255),
    pdfFileSize: z.number().int().min(0),
  })
  .superRefine((values, context) => {
    if (!values.termsType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['termsType'],
        message: '規約タイプを選択してください。',
      });
    }
    if (values.effectiveTo && values.effectiveTo <= values.effectiveFrom) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveTo'],
        message: '適用終了予定日は適用開始日より後の日付を入力してください。',
      });
    }
  });

export type TermsFormValues = z.infer<typeof TermsFormSchema>;

const MOCK_DEFAULT_PDF_URL = '/mock/terms-sample.pdf';
const MOCK_DEFAULT_PDF_FILE_NAME = 'terms-sample.pdf';
const MOCK_DEFAULT_PDF_FILE_SIZE = 835;

export const emptyTermsFormValues: TermsFormValues = {
  brandEnum: [],
  title: '',
  termsType: '',
  version: '',
  effectiveFrom: '',
  effectiveTo: null,
  displayOrder: null,
  requiresConsent: false,
  remarks: null,
  pdfUrl: MOCK_DEFAULT_PDF_URL,
  pdfFileName: MOCK_DEFAULT_PDF_FILE_NAME,
  pdfFileSize: MOCK_DEFAULT_PDF_FILE_SIZE,
};
