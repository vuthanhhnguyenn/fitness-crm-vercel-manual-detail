import { z } from 'zod';

/**
 * Zod schema for the locker contract edit form.
 * E-01: locker contracts are edit-only in the CRM (new contracts are concluded outside the CRM).
 */
export const lockerContractFormSchema = z.object({
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
