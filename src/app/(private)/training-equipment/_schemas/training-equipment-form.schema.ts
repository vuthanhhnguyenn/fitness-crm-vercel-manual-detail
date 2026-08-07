import { z } from 'zod';

export const trainingEquipmentFormSchema = z.object({
  store_id: z.string().min(1, '設置店舗を選択してください'),
  store_name: z.string().min(1),
  name: z.string().min(1, '機材名を入力してください').max(255),
  tool_type: z.enum([
    'machine',
    'cableMachine',
    'smithMachine',
    'barbell',
    'dumbbell',
    'kettlebell',
    'resistanceBand',
    'trx',
    'other',
  ]),
  quantity: z.coerce.number().int().min(1, '数量を入力してください'),
  installation_area: z
    .enum(['aerobic_area', 'machine_area', 'free_weight_area', 'stretch_area'])
    .nullable()
    .optional(),
  manufacturer: z.string().nullable().optional(),
  model_number: z.string().nullable().optional(),
  installed_on: z.string().nullable().optional(),
  status: z.enum(['installed', 'maintenance', 'removed', 'discarded']).default('installed'),
  notes: z.string().max(1000).nullable().optional(),
});

export type TrainingEquipmentFormValues = z.input<typeof trainingEquipmentFormSchema>;
export type TrainingEquipmentFormSubmitValues = z.output<typeof trainingEquipmentFormSchema>;
