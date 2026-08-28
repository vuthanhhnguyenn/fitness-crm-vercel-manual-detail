import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { addDays, isBefore, parse, startOfToday } from 'date-fns';
import { z } from 'zod';

import { deriveWithdrawalType } from '../_utils/member-operation.util';

const WITHDRAWAL_MIN_LEAD_DAYS = 7;

export { deriveWithdrawalType };

/**
 * Built per-member: the 退会予定日 rule depends on the contract's usage start date, so the
 * schema cannot be a module-level constant.
 */
export const buildWithdrawFormSchema = (usageStartDate: string | undefined) =>
  z
    .object({
      scheduled_date: z.string().min(1, '退会予定日は必須です'),
      // FR-014: one free-text field. The former 6-value picklist conflated the member's
      // motivation with the withdrawal type, which the system derives.
      reason: z.string().trim().min(1, '退会理由は必須です').max(TEXTAREA_MAX_LENGTH),
      is_proxy: z.boolean(),
      proxy_agreed_at: z.string().optional(),
      proxy_method: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.is_proxy && !data.proxy_agreed_at) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['proxy_agreed_at'],
          message: '合意日時は必須です',
        });
      }
      if (!data.scheduled_date) return;
      const scheduled = parse(data.scheduled_date, 'yyyy-MM-dd', new Date());
      if (deriveWithdrawalType(data.scheduled_date, usageStartDate) === 'cancellation') {
        // 入会取消: already strictly before the usage start date by construction
        return;
      }
      // BR-WDR-001: 通常退会 needs at least 7 days' notice.
      if (isBefore(scheduled, addDays(startOfToday(), WITHDRAWAL_MIN_LEAD_DAYS))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scheduled_date'],
          message: `退会予定日は${WITHDRAWAL_MIN_LEAD_DAYS}日以上先の日付を指定してください`,
        });
      }
    });

export type WithdrawFormValues = z.infer<ReturnType<typeof buildWithdrawFormSchema>>;
