import { z } from 'zod';

import {
  TRAINING_EQUIPMENT_NAME_MAX_LENGTH,
  TRAINING_EQUIPMENT_NOTE_MAX_LENGTH,
  TRAINING_EQUIPMENT_QUANTITY_MAX,
} from '../_constants/training-equipment.constants';

/** FR-003 / FR-005 form fields. Installation status is entered only when creating a record. */
export const trainingEquipmentFormSchema = z.object({
  storeId: z.string().min(1, '設置店舗を選択してください'),
  name: z
    .string()
    .min(1, '機材名を入力してください')
    .max(
      TRAINING_EQUIPMENT_NAME_MAX_LENGTH,
      `機材名は${TRAINING_EQUIPMENT_NAME_MAX_LENGTH}文字以内で入力してください`,
    ),
  mstToolId: z.string().min(1, '器具種別を選択してください'),
  quantity: z.coerce
    .number()
    .int()
    .min(1, '数量を入力してください')
    .max(TRAINING_EQUIPMENT_QUANTITY_MAX, '数量は9桁以内で入力してください'),
  locationInGym: z
    .enum(['aerobic_area', 'machine_area', 'free_weight_area', 'stretch_area'])
    .nullable()
    .optional(),
  manufacturer: z
    .string()
    .max(
      TRAINING_EQUIPMENT_NAME_MAX_LENGTH,
      `メーカーは${TRAINING_EQUIPMENT_NAME_MAX_LENGTH}文字以内で入力してください`,
    )
    .nullable()
    .optional(),
  model: z
    .string()
    .max(
      TRAINING_EQUIPMENT_NAME_MAX_LENGTH,
      `型番は${TRAINING_EQUIPMENT_NAME_MAX_LENGTH}文字以内で入力してください`,
    )
    .nullable()
    .optional(),
  installedOn: z.string().nullable().optional(),
  installationStatus: z
    .enum(['installed', 'maintenance', 'removed', 'discarded'])
    .default('installed'),
  note: z
    .string()
    .max(
      TRAINING_EQUIPMENT_NOTE_MAX_LENGTH,
      `備考は${TRAINING_EQUIPMENT_NOTE_MAX_LENGTH}文字以内で入力してください`,
    )
    .nullable()
    .optional(),
});

export type TrainingEquipmentFormValues = z.input<typeof trainingEquipmentFormSchema>;
export type TrainingEquipmentFormSubmitValues = z.output<typeof trainingEquipmentFormSchema>;
