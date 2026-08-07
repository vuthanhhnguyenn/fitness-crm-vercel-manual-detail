'use client';

import { z } from 'zod';

// ─── Editable Scope Row ────────────────────────────────────────────────────────
export const staffEditableScopeSchema = z
  .object({
    brand: z.enum(['all', 'joyfit', 'fit365', 'joyfit24', 'joyfit_yoga', 'joyfit_plus']),
    target: z.enum(['all_stores', 'specific_store']),
    store_id: z.string().optional().or(z.literal('')),
    store_name: z.string().optional().or(z.literal('')),
    start_date: z.string().min(1, '必須です'),
    end_date: z.string().min(1, '必須です'),
  })
  .refine((data) => new Date(data.start_date) < new Date(data.end_date), {
    message: '開始日は終了日より前にしてください',
    path: ['end_date'],
  });

// ─── Form Schema ───────────────────────────────────────────────────────────────
export const staffEditFormSchema = z.object({
  // 個人情報
  last_name: z.string().min(1, '必須です'),
  first_name: z.string().min(1, '必須です'),
  last_name_kana: z.string().optional().or(z.literal('')),
  first_name_kana: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  birthday: z.string().optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, '電話番号は10〜11桁の数字で入力してください')
    .optional()
    .or(z.literal('')),
  email: z.string().email('メール形式が正しくありません'),
  postal_code: z.string().optional().or(z.literal('')),
  prefecture: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  building: z.string().optional().or(z.literal('')),
  // ログイン設定
  login_method: z.enum(['email', 'social'], { message: '必須です' }),
  social_id: z.string().optional().or(z.literal('')),
  // 権限設定
  role: z.enum(['system', 'headquarter', 'manager', 'staff', 'trainer', 'observer'], {
    message: '必須です',
  }),
  /** 職位マスター (positions.id) */
  position_id: z.number().int().positive({ message: '必須です' }),
  billing_correction: z.boolean().default(false),
  refund_request: z.boolean().default(false),
  transfer_request: z.boolean().default(false),
  // 編集可能情報
  editable_scopes: z.array(staffEditableScopeSchema),
});

export type StaffEditFormValues = z.infer<typeof staffEditFormSchema>;
