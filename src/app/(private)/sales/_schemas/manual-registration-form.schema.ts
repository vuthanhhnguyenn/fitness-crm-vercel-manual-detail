import { z } from 'zod';

export const manualRegistrationFormSchema = z.object({
  store_id: z.string().min(1, '店舗を選択してください'),
  member_id: z.string().min(1, '利用者を選択してください'),
  billing_month: z.string().min(1, '適用月を入力してください'),
  notes: z.string().max(1000, 'メモは1000文字以内で入力してください').default(''),
});

export type ManualRegistrationFormValues = z.input<typeof manualRegistrationFormSchema>;
export type ManualRegistrationFormSubmitValues = z.output<typeof manualRegistrationFormSchema>;
