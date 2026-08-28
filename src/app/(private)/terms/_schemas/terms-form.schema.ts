import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

import { TermsBrand, TermsType } from '@/lib/api/types.gen';

export type TermsFormMode = 'create' | 'edit' | 'new-version';

export const TermsFormSchema = z
  .object({
    brandEnum: z.array(z.enum(TermsBrand)).min(1, 'ブランドを選択してください。'),
    title: z
      .string()
      .trim()
      .min(1, '規約名を入力してください')
      .max(TEXT_MAX_LENGTH, `規約名は${TEXT_MAX_LENGTH}文字以内で入力してください。`),
    termsType: z.enum(TermsType, { error: '規約タイプを選択してください。' }),
    version: z
      .string()
      .trim()
      .min(1, 'バージョンを入力してください')
      .max(TEXT_MAX_LENGTH, `バージョンは${TEXT_MAX_LENGTH}文字以内で入力してください。`),
    effectiveFrom: z.string().min(1, '適用開始日を入力してください'),
    effectiveTo: z.string().nullable().optional(),
    displayOrder: z
      .number()
      .int('表示順は1以上の整数で入力してください。')
      .min(1, '表示順は1以上の整数で入力してください。')
      .nullable()
      .optional(),
    requiresConsent: z.boolean(),
    remarks: z
      .string()
      .max(TEXTAREA_MAX_LENGTH, `備考は${TEXTAREA_MAX_LENGTH}文字以内で入力してください。`)
      .nullable()
      .optional(),
    pdfUrl: z.string().min(1, 'PDFファイルを選択してください'),
    pdfFileName: z.string().min(1),
    pdfFileSize: z.number(),
  })
  .refine(
    (data) => !data.effectiveTo || new Date(data.effectiveTo) > new Date(data.effectiveFrom),
    {
      message: '適用終了予定日は適用開始日より後の日付を入力してください。',
      path: ['effectiveTo'],
    },
  );

export type TermsFormValues = z.infer<typeof TermsFormSchema>;

// TODO(phase-2 API integration): the real presign+PUT upload flow (see
// useFileUpload) can't actually complete against the mocked `/crm/uploads/presign`
// endpoint (its presign URL points at a fake S3 host). This fixture backs a
// dev-only "set mock PDF" debug action (see TermsForm) so the registration flow
// can still be exercised locally; drop both once file upload is wired to the
// production API.
export const MOCK_SAMPLE_PDF = {
  url: '/mock/terms-sample.pdf',
  fileName: 'terms-sample.pdf',
  size: 835,
};

export const emptyTermsFormValues: TermsFormValues = {
  brandEnum: [],
  title: '',
  termsType: '' as unknown as TermsFormValues['termsType'],
  version: '',
  effectiveFrom: '',
  effectiveTo: null,
  displayOrder: null,
  requiresConsent: false,
  remarks: '',
  pdfUrl: '',
  pdfFileName: '',
  pdfFileSize: 0,
};
