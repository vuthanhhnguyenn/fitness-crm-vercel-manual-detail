import { z } from 'zod';

import {
  LockerLockType,
  LockerNumberingPattern,
  LockerOptionType,
  LockerShape,
  LockerSlotOpenType,
} from '@/lib/api/types.gen';

/**
 * E-01 FR-002: slot size W×H×D (in cm) is required as the default for the whole locker.
 * Inputs are received as strings and converted to integer cm on submit.
 */
const slotSizeDimension = (label: string) =>
  z
    .string()
    .min(1, `${label}を入力してください`)
    .regex(/^\d+$/, `${label}は数字で入力してください`)
    .transform(Number)
    .refine((value) => value > 0, { message: `${label}は1以上で入力してください` });

const slotSizeSchema = z.object({
  width_cm: slotSizeDimension('横幅'),
  height_cm: slotSizeDimension('高さ'),
  depth_cm: slotSizeDimension('奥行き'),
});

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
    /**
     * E-01 FR-012: at least one photo must be registered per locker, so the field is
     * required on both 新規 and 編集. Kept nullable because the empty form and lockers
     * prefilled from the API start out with no photo.
     */
    image_url: z
      .string()
      .nullable()
      .refine((value) => Boolean(value), { message: 'ロッカー写真を登録してください' }),
    shape: z.nativeEnum(LockerShape, { error: '形状を選択してください' }),
    /**
     * E-01 FR-003: slot numbers are auto-assigned from the shape and numbering pattern.
     * The starting number is fixed by the system, so the form has no start-value input.
     */
    slot_numbering_pattern: z.nativeEnum(LockerNumberingPattern),
    option_type: z.nativeEnum(LockerOptionType),
    /**
     * FR-013: the cabinet carries two fee options — the standard-row code applies to every
     * slot except the bottom row, the bottom-row code to the slots flagged `is_bottom_row`.
     * A slot's fee is derived from this pair rather than picked per slot.
     */
    contract_type_code: z.string().nullable().optional(),
    bottom_contract_type_code: z.string().nullable().optional(),
    default_open_type: z.nativeEnum(LockerSlotOpenType, {
      error: '開閉方法を選択してください',
    }),
    default_lock_type: z.nativeEnum(LockerLockType, {
      error: '施錠方法を選択してください',
    }),
    default_slot_size: slotSizeSchema,
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
