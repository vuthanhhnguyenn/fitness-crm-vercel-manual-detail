import { z } from 'zod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRowFilled(row: { last_name: string; first_name: string; email: string }): boolean {
  return Boolean(row.last_name.trim() || row.first_name.trim() || row.email.trim());
}

export const staffCreateRowSchema = z.object({
  last_name: z.string(),
  first_name: z.string(),
  email: z.string(),
});

export const staffCreateFormSchema = z.object({
  rows: z
    .array(staffCreateRowSchema)
    .superRefine((rows, ctx) => {
      rows.forEach((row, index) => {
        if (!isRowFilled(row)) return;
        if (!row.last_name.trim()) {
          ctx.addIssue({ code: 'custom', message: '姓は必須です', path: [index, 'last_name'] });
        } else if (row.last_name.length > 255) {
          ctx.addIssue({
            code: 'custom',
            message: '姓は255文字以内で入力してください',
            path: [index, 'last_name'],
          });
        }
        if (!row.first_name.trim()) {
          ctx.addIssue({ code: 'custom', message: '名は必須です', path: [index, 'first_name'] });
        } else if (row.first_name.length > 255) {
          ctx.addIssue({
            code: 'custom',
            message: '名は255文字以内で入力してください',
            path: [index, 'first_name'],
          });
        }
        if (!row.email.trim()) {
          ctx.addIssue({
            code: 'custom',
            message: 'メールアドレスは必須です',
            path: [index, 'email'],
          });
        } else if (!EMAIL_REGEX.test(row.email.trim())) {
          ctx.addIssue({
            code: 'custom',
            message: 'メール形式が正しくありません',
            path: [index, 'email'],
          });
        }
      });
    })
    .refine((rows) => rows.some(isRowFilled), {
      message: '少なくとも1名分の情報を入力してください',
    }),
  role: z.enum(['headquarter', 'manager', 'staff', 'trainer', 'observer'], {
    message: 'ロールを選択してください',
  }),
  position_id: z.number().int().positive().optional(),
  affiliation_type: z.enum(['direct_store', 'fc_company']),
  store_id: z.string().optional(),
  fc_company_id: z.string().optional(),
  note: z.string().max(1000, '備考は1000文字以内で入力してください').optional(),
});

export type StaffCreateFormValues = z.infer<typeof staffCreateFormSchema>;
export { isRowFilled };
