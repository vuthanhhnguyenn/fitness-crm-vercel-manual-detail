import { z } from 'zod';

export const CONTROLLER_STATUS_VALUES = ['normal', 'error', 'maintenance', 'discarded'] as const;

const LOCAL_IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

function isIntegerInRange(value: string, min: number, max: number): boolean {
  if (!/^\d+$/.test(value)) return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
}

/** Shared zod schema for 接点制御装置 新規登録 / 編集 (FR-007). */
export const controllerFormSchema = z.object({
  name: z.string().min(1, '装置名を入力してください'),
  store_code: z.string().min(1, '店舗コードを選択してください'),
  location: z.string().min(1, '設置場所を入力してください'),
  ip_address: z
    .string()
    .min(1, 'IPアドレスを入力してください')
    .regex(LOCAL_IP_REGEX, 'IPアドレスの形式が正しくありません（例: 192.168.1.10）'),
  port: z
    .string()
    .min(1, 'ポート番号を入力してください')
    .refine((value) => isIntegerInRange(value, 1, 65535), '1〜65535 の範囲で入力してください'),
  control_port_count: z
    .string()
    .min(1, '制御ポート数を入力してください')
    .refine((value) => isIntegerInRange(value, 1, 64), '1〜64 の範囲で入力してください'),
  firmware_version: z.string(),
  status: z.enum(CONTROLLER_STATUS_VALUES),
});

export type ControllerFormValues = z.input<typeof controllerFormSchema>;
export type ControllerFormSubmitValues = z.output<typeof controllerFormSchema>;
