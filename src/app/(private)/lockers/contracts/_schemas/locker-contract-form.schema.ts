import { z } from 'zod';

/** Shared zod schema for ロッカー契約新規 / ロッカー契約編集 */
export const lockerContractFormSchema = z.object({
  member_id: z.string().min(1, '会員を選択してください'),
  locker_id: z.string().min(1, 'ロッカー設備を選択してください'),
  slot_number: z.string().min(1, 'スロット番号を選択してください'),
  contract_type_code: z.string().min(1, '契約種類を選択してください'),
  start_date: z.date({ error: '契約開始日を入力してください' }),
  password: z
    .union([z.literal(''), z.string().regex(/^\d{4}$/, '4桁の数字を入力してください')])
    .optional(),
});

export type LockerContractFormValues = z.input<typeof lockerContractFormSchema>;
export type LockerContractFormSubmitValues = z.output<typeof lockerContractFormSchema>;
