import { z } from 'zod';

export const EQUIPMENT_TYPE_VALUES = [
  'entry_gate',
  'hydrogen_water_server',
  'body_composition_monitor',
  'tanning_machine',
  'protein_server',
  'other',
] as const;

export const EQUIPMENT_STATUS_VALUES = ['normal', 'error', 'maintenance', 'discarded'] as const;

export const EQUIPMENT_AUTH_VALUES = ['member_qr_scan', 'device_qr_scan', 'none'] as const;

const usageControlRuleSchema = z.object({
  main_enabled: z.boolean(),
  main_contract_type: z.string().nullable(),
  option_enabled: z.boolean(),
  option_type: z.string().nullable(),
  per_use_enabled: z.boolean(),
  per_use_option_type: z.string().nullable(),
});

/** Shared zod schema for 接続機器 新規登録 / 編集 (FR-003 / FR-005). */
export const equipmentFormSchema = z
  .object({
    name: z.string().min(1, '機器名を入力してください'),
    equipment_type: z.enum(EQUIPMENT_TYPE_VALUES, { error: '機器タイプを選択してください' }),
    serial_number: z.string().min(1, 'シリアルナンバーを入力してください'),
    install_location: z.string().min(1, '設置場所を入力してください'),
    installed_on: z.string().min(1, '設置日を入力してください'),
    status: z.enum(EQUIPMENT_STATUS_VALUES),
    authentication_method: z
      .enum(EQUIPMENT_AUTH_VALUES)
      .nullable()
      .refine((value) => value !== null, { message: '認証方式を選択してください' }),
    controller_id: z
      .string()
      .nullable()
      .refine((value) => Boolean(value), { message: '接続先接点制御装置を選択してください' }),
    controller_number: z.string().min(1, '接続先ポート番号を入力してください'),
    ip_address: z.string(),
    mac_address: z.string(),
    usage_control_rule: usageControlRuleSchema,
    remarks: z.string(),
  })
  .superRefine((data, ctx) => {
    const rule = data.usage_control_rule;

    if (rule.main_enabled && !rule.main_contract_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '主契約タイプを選択してください',
        path: ['usage_control_rule', 'main_contract_type'],
      });
    }
    if (rule.option_enabled && !rule.option_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'オプション種別を選択してください',
        path: ['usage_control_rule', 'option_type'],
      });
    }
    if (rule.per_use_enabled && !rule.per_use_option_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '都次オプション種別を選択してください',
        path: ['usage_control_rule', 'per_use_option_type'],
      });
    }
  });

export type EquipmentFormValues = z.input<typeof equipmentFormSchema>;
export type EquipmentFormSubmitValues = z.output<typeof equipmentFormSchema>;
export type EquipmentUsageControlRuleFormValue = z.infer<typeof usageControlRuleSchema>;
