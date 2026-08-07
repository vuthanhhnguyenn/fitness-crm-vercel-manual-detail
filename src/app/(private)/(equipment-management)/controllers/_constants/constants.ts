import type {
  GetCrmControllersByIdHistoryResponse,
  GetCrmControllersResponse,
} from '@/lib/api/types.gen';

import {
  EQUIPMENT_STATUS_BADGE_MAP,
  EQUIPMENT_STATUS_LABELS,
} from '../../equipment/_constants/constants';

type ControllerListItem = GetCrmControllersResponse['items'][number];

export type ControllerStatus = ControllerListItem['status'];

// Status presentation is shared with connected equipment (same EquipmentStatus enum).
export const CONTROLLER_STATUS_LABELS = EQUIPMENT_STATUS_LABELS;
export const CONTROLLER_STATUS_BADGE_MAP = EQUIPMENT_STATUS_BADGE_MAP;

export const CONTROLLER_STATUS_VALUES: ControllerStatus[] = [
  'normal',
  'error',
  'maintenance',
  'discarded',
];

type ControllerHistoryItem = GetCrmControllersByIdHistoryResponse['items'][number];

export type ControllerHistoryChangeType = ControllerHistoryItem['change_type'];

export const CONTROLLER_HISTORY_CHANGE_TYPE_LABELS: Record<ControllerHistoryChangeType, string> = {
  created: '新規作成',
  status_change: 'ステータス変更',
  fault_report: '故障報告',
  inspection: '点検完了',
};

// Form helper texts (sourced from the prototype controller form)
export const CONTROLLER_FORM_HELPER_TEXTS = {
  ipAddress: 'ローカルIPアドレス形式（例: 192.168.1.100）',
  firmwareVersion: '装置のラベルまたは設定画面に表示される vN.N.N 形式',
  controlPortCount: '装置の物理ポート数（通常 4 / 8 / 16）',
  port: '装置の通信ポート（通常 80）',
} as const;

export const CONTROLLER_LIST_COLUMN_HEADERS = {
  controllerId: '装置ID',
  name: '装置名',
  storeCode: '店舗コード',
  location: '設置場所',
  ipAddress: 'IPアドレス',
  firmwareVersion: 'FW',
  controlPortCount: '制御ポート数',
  deviceCount: '紐付き機器数',
  status: 'ステータス',
} as const;
