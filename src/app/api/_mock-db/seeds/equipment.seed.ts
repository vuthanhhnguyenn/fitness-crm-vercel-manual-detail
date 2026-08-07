import type {
  Controller,
  ControllerDeviceSummary,
  ControllerHistoryItem,
} from '@/app/api/_schemas/controller.schema';
import type {
  ConnectedEquipmentDetail,
  ConnectedEquipmentListItem,
  ControllerSummary,
  EquipmentStatusHistoryItem,
  EquipmentUsageControlRuleInput,
  UsageControlRuleDisplay,
} from '@/app/api/_schemas/equipment.schema';

export const SEED_CONNECTED_EQUIPMENT: ConnectedEquipmentListItem[] = [
  {
    id: 'EQ-0001',
    name: '水素水サーバー',
    store_id: 'store-002',
    store_name: 'Fit365新宿店',
    controller_number: 1,
    qr_code_id: null,
    equipment_type: 'hydrogen_water_server',
    serial_number: 'SN-20250101-001',
    ip_address: '192.168.1.100',
    mac_address: '00:11:22:33:44:55',
    install_location: '1F 休憩スペース',
    installed_on: '2026-01-10',
    status: 'normal',
    authentication_method: 'none',
    linked_contract_labels: ['水素水オプション'],
    updated_at: '2026-03-08T10:00:00+09:00',
  },
  {
    id: 'EQ-0002',
    name: 'プロテインサーバー',
    store_id: 'store-002',
    store_name: 'Fit365新宿店',
    controller_number: 2,
    qr_code_id: null,
    equipment_type: 'protein_server',
    serial_number: 'SN-20250101-002',
    ip_address: '192.168.1.101',
    mac_address: '00:11:22:33:44:56',
    install_location: '1F フロント横',
    installed_on: '2026-01-11',
    status: 'normal',
    authentication_method: 'device_qr_scan',
    linked_contract_labels: ['プロテインオプション'],
    updated_at: '2026-03-08T10:10:00+09:00',
  },
  {
    id: 'EQ-0003',
    name: '入口自動ドア',
    store_id: 'store-003',
    store_name: 'Fit365渋谷店',
    controller_number: 3,
    qr_code_id: 'QR-12',
    equipment_type: 'entry_gate',
    serial_number: 'SN-20240601-003',
    ip_address: '192.168.1.102',
    mac_address: '00:11:22:33:44:57',
    install_location: '1F 入口',
    installed_on: '2025-06-01',
    status: 'error',
    authentication_method: 'member_qr_scan',
    linked_contract_labels: ['メイン契約'],
    updated_at: '2026-03-05T14:22:00+09:00',
  },
  {
    id: 'EQ-0004',
    name: 'タンニングマシン A',
    store_id: 'store-003',
    store_name: 'Fit365渋谷店',
    controller_number: 4,
    qr_code_id: 'QR-18',
    equipment_type: 'tanning_machine',
    serial_number: 'SN-20240601-004',
    ip_address: '192.168.1.103',
    mac_address: '00:11:22:33:44:58',
    install_location: '2F スタジオ',
    installed_on: '2025-06-01',
    status: 'error',
    authentication_method: 'member_qr_scan',
    linked_contract_labels: ['タンニング都度利用', 'タンニングオプション'],
    updated_at: '2026-02-28T16:45:00+09:00',
  },
  {
    id: 'EQ-0005',
    name: '体組成計',
    store_id: 'store-004',
    store_name: 'JOYFIT池袋店',
    controller_number: 5,
    qr_code_id: 'QR-20',
    equipment_type: 'body_composition_monitor',
    serial_number: 'SN-20250301-005',
    ip_address: null,
    mac_address: null,
    install_location: '1F カウンター前',
    installed_on: '2026-03-01',
    status: 'normal',
    authentication_method: 'member_qr_scan',
    linked_contract_labels: ['体組成計利用'],
    updated_at: '2026-01-20T09:00:00+09:00',
  },
  {
    id: 'EQ-0006',
    name: 'プロテインサーバー B',
    store_id: 'store-004',
    store_name: 'JOYFIT池袋店',
    controller_number: 6,
    qr_code_id: null,
    equipment_type: 'protein_server',
    serial_number: 'SN-20250301-006',
    ip_address: '192.168.1.104',
    mac_address: '00:11:22:33:44:59',
    install_location: '1F ロビー',
    installed_on: '2026-03-01',
    status: 'maintenance',
    authentication_method: 'device_qr_scan',
    linked_contract_labels: ['プロテインオプション'],
    updated_at: '2026-03-08T10:00:00+09:00',
  },
  {
    id: 'EQ-0007',
    name: 'シャワー利用ゲート',
    store_id: 'store-004',
    store_name: 'JOYFIT池袋店',
    controller_number: 7,
    qr_code_id: 'QR-31',
    equipment_type: 'other',
    serial_number: 'SN-20241220-007',
    ip_address: '192.168.1.105',
    mac_address: null,
    install_location: '2F シャワー前',
    installed_on: '2025-12-20',
    status: 'maintenance',
    authentication_method: 'member_qr_scan',
    linked_contract_labels: ['シャワーオプション'],
    updated_at: '2026-03-07T12:30:00+09:00',
  },
  {
    id: 'EQ-0008',
    name: '旧プロテインサーバー',
    store_id: 'store-002',
    store_name: 'Fit365新宿店',
    controller_number: 8,
    qr_code_id: null,
    equipment_type: 'protein_server',
    serial_number: 'SN-20220115-008',
    ip_address: null,
    mac_address: '00:11:22:33:44:60',
    install_location: '倉庫',
    installed_on: '2022-01-15',
    status: 'discarded',
    authentication_method: 'none',
    linked_contract_labels: ['プロテインオプション'],
    updated_at: '2026-01-05T08:00:00+09:00',
  },
];

export const SEED_CONTROLLERS: Controller[] = [
  {
    controller_id: 'CTRL-001',
    controller_number: 1,
    name: '制御装置 新宿 1号',
    store_code: 'S-001',
    location: '受付室 機器ラック',
    ip_address: '192.168.1.10',
    port: 80,
    firmware_version: 'v2.4.1',
    control_port_count: 8,
    status: 'normal',
    created_at: '2024-04-01T09:00:00+09:00',
    updated_at: '2026-01-10T09:00:00+09:00',
  },
  {
    controller_id: 'CTRL-002',
    controller_number: 2,
    name: '制御装置 新宿 2号',
    store_code: 'S-001',
    location: 'トレーニングフロア 北側',
    ip_address: '192.168.1.11',
    port: 81,
    firmware_version: 'v2.4.1',
    control_port_count: 4,
    status: 'normal',
    created_at: '2024-04-01T09:00:00+09:00',
    updated_at: '2026-01-10T09:00:00+09:00',
  },
  {
    controller_id: 'CTRL-003',
    controller_number: 3,
    name: '制御装置 渋谷 1号',
    store_code: 'S-002',
    location: '受付室 機器ラック',
    ip_address: '192.168.1.12',
    port: 82,
    firmware_version: 'v2.3.0',
    control_port_count: 16,
    status: 'error',
    created_at: '2023-11-15T09:00:00+09:00',
    updated_at: '2026-02-20T09:00:00+09:00',
  },
  {
    controller_id: 'CTRL-004',
    controller_number: 4,
    name: '制御装置 渋谷 2号',
    store_code: 'S-002',
    location: 'スタジオ入口',
    ip_address: '192.168.1.13',
    port: 83,
    firmware_version: null,
    control_port_count: 4,
    status: 'error',
    created_at: '2023-11-15T09:00:00+09:00',
    updated_at: '2026-02-20T09:00:00+09:00',
  },
  {
    controller_id: 'CTRL-005',
    controller_number: 5,
    name: '制御装置 池袋 1号',
    store_code: 'S-003',
    location: '受付室 機器ラック',
    ip_address: '192.168.1.14',
    port: 84,
    firmware_version: 'v2.4.0',
    control_port_count: 8,
    status: 'normal',
    created_at: '2024-07-20T09:00:00+09:00',
    updated_at: '2026-01-05T09:00:00+09:00',
  },
  {
    controller_id: 'CTRL-006',
    controller_number: 6,
    name: '制御装置 池袋 2号',
    store_code: 'S-003',
    location: 'マシンエリア',
    ip_address: '192.168.1.15',
    port: 85,
    firmware_version: 'v2.4.0',
    control_port_count: 12,
    status: 'maintenance',
    created_at: '2024-07-20T09:00:00+09:00',
    updated_at: '2026-03-01T09:00:00+09:00',
  },
  {
    controller_id: 'CTRL-007',
    controller_number: 7,
    name: '制御装置 池袋 3号',
    store_code: 'S-003',
    location: 'ロッカールーム前',
    ip_address: '192.168.1.16',
    port: 86,
    firmware_version: 'v2.2.5',
    control_port_count: 4,
    status: 'maintenance',
    created_at: '2024-07-20T09:00:00+09:00',
    updated_at: '2026-03-01T09:00:00+09:00',
  },
  {
    controller_id: 'CTRL-008',
    controller_number: 8,
    name: '制御装置 新宿 旧号',
    store_code: 'S-001',
    location: '倉庫',
    ip_address: '192.168.1.17',
    port: 87,
    firmware_version: null,
    control_port_count: 4,
    status: 'discarded',
    created_at: '2022-01-15T09:00:00+09:00',
    updated_at: '2025-12-01T09:00:00+09:00',
  },
];

export function buildControllerHistorySeed(controller: Controller): ControllerHistoryItem[] {
  const genesis: ControllerHistoryItem = {
    occurred_at: controller.created_at,
    operator: 'システム',
    change_type: 'created',
    from_status: null,
    to_status: null,
    memo: '接点制御装置を新規登録しました。',
  };

  const followUps: ControllerHistoryItem[] = [];

  if (controller.status === 'error') {
    followUps.push({
      occurred_at: controller.updated_at,
      operator: '山田太郎',
      change_type: 'fault_report',
      from_status: 'normal',
      to_status: 'error',
      memo: '通信エラーを検知。現地確認を依頼。',
    });
  } else if (controller.status === 'maintenance') {
    followUps.push({
      occurred_at: controller.updated_at,
      operator: '佐藤花子',
      change_type: 'status_change',
      from_status: 'normal',
      to_status: 'maintenance',
      memo: '定期点検のためメンテナンス中に変更。',
    });
  } else if (controller.status === 'normal') {
    followUps.push({
      occurred_at: controller.updated_at,
      operator: '佐藤花子',
      change_type: 'inspection',
      from_status: 'normal',
      to_status: 'normal',
      memo: '定期点検実施。異常なし。',
    });
  }

  return [...followUps, genesis];
}

export const SEED_CONTROLLER_HISTORY: Record<string, ControllerHistoryItem[]> = Object.fromEntries(
  SEED_CONTROLLERS.map((controller) => [
    controller.controller_id,
    buildControllerHistorySeed(controller),
  ]),
);

export function buildControllerDeviceSummary(
  devices: { status: string }[],
): ControllerDeviceSummary {
  return {
    total: devices.length,
    normal: devices.filter((device) => device.status === 'normal').length,
    error: devices.filter((device) => device.status === 'error').length,
  };
}

export function buildUsageControlRule(item: ConnectedEquipmentListItem): UsageControlRuleDisplay {
  const contract_link_types: Array<'main' | 'option' | 'per_use'> = [];
  let option_type_label: string | null = null;
  let main_contract_type_label: string | null = null;
  let per_use_option_type_label: string | null = null;

  for (const label of item.linked_contract_labels) {
    if (label.includes('メイン')) {
      if (!contract_link_types.includes('main')) {
        contract_link_types.push('main');
      }
      main_contract_type_label = label;
      continue;
    }

    if (label.includes('都次')) {
      if (!contract_link_types.includes('per_use')) {
        contract_link_types.push('per_use');
      }
      per_use_option_type_label = label.replace(/都次利用$/, '').trim() || label;
      continue;
    }

    if (!contract_link_types.includes('option')) {
      contract_link_types.push('option');
    }
    option_type_label = label.replace(/オプション$/, '').trim() || label;
  }

  if (contract_link_types.length === 0) {
    contract_link_types.push('option');
  }

  return {
    contract_link_types,
    option_type_label,
    main_contract_type_label,
    per_use_option_type_label,
    show_gate_stop_info: item.equipment_type === 'entry_gate',
  };
}

export type EquipmentMeta = {
  controller_id: string | null;
  remarks: string | null;
  usage_control_rule: EquipmentUsageControlRuleInput | null;
};

export function buildUsageControlRuleFromInput(
  rule: EquipmentUsageControlRuleInput,
  equipmentType: ConnectedEquipmentListItem['equipment_type'],
): UsageControlRuleDisplay {
  const contract_link_types: Array<'main' | 'option' | 'per_use'> = [];
  if (rule.main_enabled) contract_link_types.push('main');
  if (rule.option_enabled) contract_link_types.push('option');
  if (rule.per_use_enabled) contract_link_types.push('per_use');

  return {
    contract_link_types,
    option_type_label: rule.option_enabled ? rule.option_type : null,
    main_contract_type_label: rule.main_enabled ? rule.main_contract_type : null,
    per_use_option_type_label: rule.per_use_enabled ? rule.per_use_option_type : null,
    show_gate_stop_info: equipmentType === 'entry_gate',
  };
}

export function buildLabelsFromRule(rule: EquipmentUsageControlRuleInput | null): string[] {
  if (!rule) return [];
  const labels: string[] = [];
  if (rule.main_enabled && rule.main_contract_type) labels.push('メイン契約');
  if (rule.option_enabled && rule.option_type) labels.push(`${rule.option_type}オプション`);
  if (rule.per_use_enabled && rule.per_use_option_type) labels.push(rule.per_use_option_type);
  return labels;
}

export function buildEquipmentDetail(
  item: ConnectedEquipmentListItem,
  meta?: EquipmentMeta,
): ConnectedEquipmentDetail {
  const controller =
    (meta?.controller_id
      ? SEED_CONTROLLERS.find((entry) => entry.controller_id === meta.controller_id)
      : undefined) ??
    SEED_CONTROLLERS.find((entry) => entry.controller_number === item.controller_number);

  const controller_summary: ControllerSummary = controller
    ? {
        controller_id: controller.controller_id,
        ip_address: controller.ip_address,
        port: controller.port,
        status: controller.status,
        name: controller.name,
      }
    : {
        controller_id: `CTRL-${String(item.controller_number).padStart(3, '0')}`,
        ip_address: item.ip_address ?? '0.0.0.0',
        port: 80,
        status: item.status,
        name: null,
      };

  const usage_control_rule = meta?.usage_control_rule
    ? buildUsageControlRuleFromInput(meta.usage_control_rule, item.equipment_type)
    : buildUsageControlRule(item);

  return {
    ...item,
    usage_control_rule,
    controller_summary,
    controller_id: meta?.controller_id ?? controller?.controller_id ?? null,
    remarks: meta?.remarks ?? null,
    created_at: `${item.installed_on}T09:00:00+09:00`,
    last_status_confirmed_at: item.updated_at,
  };
}

export function buildEquipmentHistorySeed(
  equipmentId: string,
  installedOn: string,
): EquipmentStatusHistoryItem[] {
  const createdAt = `${installedOn}T10:00:00+09:00`;

  return [
    {
      id: `${equipmentId}-hist-002`,
      occurred_at: '2026-02-15T10:00:00+09:00',
      operator_name: '山田太郎',
      event_type: 'status_change',
      from_status: 'maintenance',
      to_status: 'normal',
      change_reason: '動作確認・清掃実施。異常なし。',
    },
    {
      id: `${equipmentId}-hist-001`,
      occurred_at: createdAt,
      operator_name: 'システム',
      event_type: 'created',
      from_status: null,
      to_status: null,
      change_reason: null,
    },
  ];
}

export const SEED_EQUIPMENT_HISTORY: Record<string, EquipmentStatusHistoryItem[]> = {
  'EQ-0001': [
    {
      id: 'EQ-0001-hist-004',
      occurred_at: '2026-02-15T10:00:00+09:00',
      operator_name: '山田太郎',
      event_type: 'status_change',
      from_status: 'maintenance',
      to_status: 'normal',
      change_reason: '動作確認・清掃実施。異常なし。',
    },
    {
      id: 'EQ-0001-hist-003',
      occurred_at: '2025-11-20T14:30:00+09:00',
      operator_name: '田中花子',
      event_type: 'status_change',
      from_status: 'error',
      to_status: 'normal',
      change_reason: '水漏れ修理。パッキン交換。',
    },
    {
      id: 'EQ-0001-hist-002',
      occurred_at: '2025-11-18T09:00:00+09:00',
      operator_name: '田中花子',
      event_type: 'status_change',
      from_status: 'normal',
      to_status: 'error',
      change_reason: '水漏れを発見。使用停止。',
    },
    {
      id: 'EQ-0001-hist-001',
      occurred_at: '2026-01-10T10:00:00+09:00',
      operator_name: 'システム',
      event_type: 'created',
      from_status: null,
      to_status: null,
      change_reason: null,
    },
  ],
  'EQ-0002': buildEquipmentHistorySeed('EQ-0002', '2026-01-11'),
  'EQ-0003': buildEquipmentHistorySeed('EQ-0003', '2025-06-01'),
  'EQ-0004': buildEquipmentHistorySeed('EQ-0004', '2025-06-01'),
  'EQ-0005': buildEquipmentHistorySeed('EQ-0005', '2026-03-01'),
  'EQ-0006': buildEquipmentHistorySeed('EQ-0006', '2026-03-01'),
  'EQ-0007': buildEquipmentHistorySeed('EQ-0007', '2025-12-20'),
  'EQ-0008': buildEquipmentHistorySeed('EQ-0008', '2022-01-15'),
};
