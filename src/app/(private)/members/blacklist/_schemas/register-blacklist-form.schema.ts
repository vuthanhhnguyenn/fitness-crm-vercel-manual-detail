import { z } from 'zod';

import { BlacklistManualReason } from '@/lib/api/types.gen';

export const RegisterBlacklistFormSchema = z.object({
  memberId: z.string().min(1, '会員IDを入力してください'),
  memberName: z.string().min(1, '氏名を入力してください'),
  reason: z.nativeEnum(BlacklistManualReason, {
    error: '登録理由を選択してください',
  }),
  memo: z.string().optional(),
});

export type RegisterBlacklistFormValues = z.infer<typeof RegisterBlacklistFormSchema>;
