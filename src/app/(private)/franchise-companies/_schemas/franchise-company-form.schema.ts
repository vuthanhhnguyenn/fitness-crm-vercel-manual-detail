import { z } from 'zod';

import { FranchiseCompanyStatus, FranchiseCompanyType } from '@/lib/api/types.gen';

const DATE_VALUE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const franchiseCompanyFormSchema = z
  .object({
    formal_name: z.string().trim().min(1, '法人名（正式名称）は必須です'),
    display_name: z.string().default(''),
    type: z.nativeEnum(FranchiseCompanyType, { error: '直営/FC区分を選択してください' }),
    direct_owned_flag: z.boolean().default(false),
    corporate_number: z.string().default(''),
    representative_name: z.string().default(''),
    head_office_address: z.string().default(''),
    phone: z.string().default(''),
    contact_person: z.string().default(''),
    contact_phone: z.string().default(''),
    fc_contract_start_date: z
      .string()
      .default('')
      .refine((value) => value === '' || DATE_VALUE_REGEX.test(value), {
        message: 'FC契約開始日はYYYY-MM-DD形式で入力してください',
      }),
    fc_contract_renewal_date: z
      .string()
      .default('')
      .refine((value) => value === '' || DATE_VALUE_REGEX.test(value), {
        message: 'FC契約更新日はYYYY-MM-DD形式で入力してください',
      }),
    royalty_rate: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce
        .number({ error: 'ロイヤリティ率は数値で入力してください' })
        .min(0, 'ロイヤリティ率は0以上で入力してください')
        .max(100, 'ロイヤリティ率は100以下で入力してください')
        .optional(),
    ),
    note: z.string().default(''),
    status: z.nativeEnum(FranchiseCompanyStatus).default(FranchiseCompanyStatus.ACTIVE),
  })
  .superRefine((value, ctx) => {
    if (
      value.fc_contract_start_date &&
      value.fc_contract_renewal_date &&
      value.fc_contract_renewal_date < value.fc_contract_start_date
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fc_contract_renewal_date'],
        message: 'FC契約更新日は開始日以降の日付を選択してください',
      });
    }
  });

export type FranchiseCompanyFormValues = z.input<typeof franchiseCompanyFormSchema>;
export type FranchiseCompanyFormSubmitValues = z.output<typeof franchiseCompanyFormSchema>;
