import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import {
  isJapaneseCorporateNumber,
  isJapanesePhoneNumber,
  japaneseCorporateNumberMessage,
  japanesePhoneMessage,
} from '@/utils/validation.util';
import { z } from 'zod';

import {
  FranchiseCompanyAuthMethod,
  FranchiseCompanyStatus,
  FranchiseCompanyType,
} from '@/lib/api/types.gen';

const DATE_VALUE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const franchiseCompanyFormSchema = z
  .object({
    formal_name: z
      .string()
      .trim()
      .min(1, '法人名（正式名称）を入力してください')
      .max(TEXT_MAX_LENGTH, `法人名（正式名称）は${TEXT_MAX_LENGTH}文字以内で入力してください。`),
    display_name: z
      .string()
      .max(TEXT_MAX_LENGTH, `法人名（表示名）は${TEXT_MAX_LENGTH}文字以内で入力してください。`)
      .default(''),
    type: z.nativeEnum(FranchiseCompanyType, { error: '直営/FC区分を選択してください' }),
    direct_owned_flag: z.boolean().default(false),
    corporate_number: z
      .string()
      .max(TEXT_MAX_LENGTH, `法人番号は${TEXT_MAX_LENGTH}文字以内で入力してください。`)
      .default('')
      .refine((value) => value === '' || isJapaneseCorporateNumber(value.trim()), {
        message: japaneseCorporateNumberMessage('法人番号'),
      }),
    representative_name: z
      .string()
      .max(TEXT_MAX_LENGTH, `代表者名は${TEXT_MAX_LENGTH}文字以内で入力してください。`)
      .default(''),
    head_office_address: z
      .string()
      .max(TEXT_MAX_LENGTH, `本社所在地は${TEXT_MAX_LENGTH}文字以内で入力してください。`)
      .default(''),
    phone: z
      .string()
      .max(TEXT_MAX_LENGTH, `電話番号は${TEXT_MAX_LENGTH}文字以内で入力してください。`)
      .default('')
      .refine((value) => value === '' || isJapanesePhoneNumber(value.trim()), {
        message: japanesePhoneMessage('電話番号'),
      }),
    contact_person: z
      .string()
      .max(TEXT_MAX_LENGTH, `担当者名は${TEXT_MAX_LENGTH}文字以内で入力してください。`)
      .default(''),
    contact_phone: z
      .string()
      .default('')
      .refine((value) => value === '' || isJapanesePhoneNumber(value.trim()), {
        message: japanesePhoneMessage('担当者連絡先'),
      }),
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
    note: z
      .string()
      .max(TEXTAREA_MAX_LENGTH, `備考は${TEXTAREA_MAX_LENGTH}文字以内で入力してください。`)
      .default(''),
    auth_method: z.nativeEnum(FranchiseCompanyAuthMethod, { error: '認証方式を選択してください' }),
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
