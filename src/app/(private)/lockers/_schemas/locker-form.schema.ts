import { z } from 'zod';

import {
  LockerLockType,
  LockerNumberingPattern,
  LockerOptionType,
  LockerShape,
  LockerSlotOpenType,
} from '@/lib/api/types.gen';

const slotLockSettingSchema = z.object({
  slot_number: z.string(),
  lock_type: z.nativeEnum(LockerLockType),
  password: z
    .union([z.literal(''), z.string().regex(/^\d{4}$/)])
    .nullable()
    .optional(),
});

/** Shared zod schema for ロッカー新規 / ロッカー編集 */
export const lockerFormSchema = z
  .object({
    store_id: z.string().min(1, '設置店舗を選択してください'),
    location_symbol: z.string().min(1, '設置エリアを選択してください'),
    area_label: z.string().optional(),
    guide_text: z.string().optional(),
    note: z.string().optional(),
    image_url: z.string().nullable().optional(),
    shape: z.nativeEnum(LockerShape, { error: '形状を選択してください' }),
    slot_numbering_pattern: z.nativeEnum(LockerNumberingPattern),
    start_number: z.coerce.number().int().min(1, '開始値は1以上で入力してください').default(1),
    option_type: z.nativeEnum(LockerOptionType),
    contract_type_code: z.string().nullable().optional(),
    default_open_type: z.nativeEnum(LockerSlotOpenType, {
      error: '開閉方法を選択してください',
    }),
    default_lock_type: z.nativeEnum(LockerLockType, {
      error: '施錠方法を選択してください',
    }),
    slot_lock_settings: z.array(slotLockSettingSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.option_type !== LockerOptionType.NONE && !data.contract_type_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '契約形態コードを選択してください',
        path: ['contract_type_code'],
      });
    }
  });

export type LockerFormValues = z.input<typeof lockerFormSchema>;
export type LockerFormSubmitValues = z.output<typeof lockerFormSchema>;

export type LockerSlotLockSettingFormValue = z.infer<typeof slotLockSettingSchema>;
