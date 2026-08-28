import type { DefaultValues } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

import { BlacklistReasonCategory } from '@/lib/api/types.gen';

/**
 * FR-035 / FR-043 / FR-044 — the Sheet collects a resolved member, one reason and an
 * optional memo.
 *
 * The resolved member is deliberately **not** a form field: it is derived from what the
 * operator typed or picked, and the Sheet blocks submission until it exists (FR-047).
 * The endpoint is member-scoped, so the record id is read from that derived value at
 * submit time rather than mirrored into form state.
 *
 * `reason` is a single value here and is sent as a one-element `reason_categories` array —
 * the contract accepts up to five, but V0's control is single-select (FR-043).
 */
export const RegisterBlacklistFormSchema = z.object({
  reason: z.nativeEnum(BlacklistReasonCategory, {
    error: '登録理由を選択してください',
  }),
  memo: z.string().max(TEXTAREA_MAX_LENGTH).optional(),
});

export type RegisterBlacklistFormValues = z.infer<typeof RegisterBlacklistFormSchema>;

/**
 * Shared by both registration surfaces — the list screen's Sheet and the member-detail
 * dialog (FR-074). `reason` starts unset, which `RegisterBlacklistFormValues` does not
 * allow; react-hook-form's `DefaultValues` is the type that models exactly that, so no
 * cast is needed.
 */
export const REGISTER_BLACKLIST_DEFAULT_VALUES: DefaultValues<RegisterBlacklistFormValues> = {
  reason: undefined,
  memo: '',
};
