import type {
  FranchiseCompanyDetail,
  FranchiseCompanyHistoryItem,
} from '@/app/api/_schemas/franchise-company.schema';

import type { EnrollmentFeeMasterRow, FranchiseCompanyRow } from './user.seed';

export interface CorporateMasterRow {
  id: string;
  name: string;
  code: string;
}

export const SEED_FRANCHISE_COMPANIES: FranchiseCompanyRow[] = [
  {
    id: 'fc-001',
    formal_name: 'サンプルFC株式会社',
    display_name: 'サンプルFC株式会社',
    type: 'fc',
    direct_owned_flag: false,
    corporate_number: null,
    representative_name: null,
    head_office_address: null,
    phone: null,
    contact_person: null,
    contact_phone: null,
    fc_contract_start_date: null,
    fc_contract_renewal_date: null,
    royalty_rate: null,
    note: null,
    managed_store_count: 1,
    status: 'active',
    created_at: '2024-04-01T10:00:00+09:00',
    updated_at: '2024-04-01T10:00:00+09:00',
  },
  {
    id: 'fc-002',
    formal_name: '株式会社フィットネスパートナーズ',
    display_name: '株式会社フィットネスパートナーズ',
    type: 'fc',
    direct_owned_flag: false,
    corporate_number: null,
    representative_name: null,
    head_office_address: null,
    phone: null,
    contact_person: null,
    contact_phone: null,
    fc_contract_start_date: null,
    fc_contract_renewal_date: null,
    royalty_rate: null,
    note: null,
    managed_store_count: 3,
    status: 'active',
    created_at: '2024-04-01T10:00:00+09:00',
    updated_at: '2024-04-01T10:00:00+09:00',
  },
  {
    id: 'fc-003',
    formal_name: '株式会社フィットイースト',
    display_name: '株式会社フィットイースト',
    type: 'fc',
    direct_owned_flag: false,
    corporate_number: null,
    representative_name: null,
    head_office_address: null,
    phone: null,
    contact_person: null,
    contact_phone: null,
    fc_contract_start_date: null,
    fc_contract_renewal_date: null,
    royalty_rate: null,
    note: null,
    managed_store_count: 1,
    status: 'active',
    created_at: '2024-04-01T10:00:00+09:00',
    updated_at: '2024-04-01T10:00:00+09:00',
  },
  {
    id: 'fc-004',
    formal_name: '株式会社ノースフィットネス',
    display_name: '株式会社ノースフィットネス',
    type: 'fc',
    direct_owned_flag: false,
    corporate_number: null,
    representative_name: null,
    head_office_address: null,
    phone: null,
    contact_person: null,
    contact_phone: null,
    fc_contract_start_date: null,
    fc_contract_renewal_date: null,
    royalty_rate: null,
    note: null,
    managed_store_count: 1,
    status: 'active',
    created_at: '2024-04-01T10:00:00+09:00',
    updated_at: '2024-04-01T10:00:00+09:00',
  },
  {
    id: 'dc-001',
    formal_name: '株式会社ウェルネスフロンティア',
    display_name: '株式会社ウェルネスフロンティア',
    type: 'direct',
    direct_owned_flag: true,
    corporate_number: null,
    representative_name: null,
    head_office_address: null,
    phone: null,
    contact_person: null,
    contact_phone: null,
    fc_contract_start_date: null,
    fc_contract_renewal_date: null,
    royalty_rate: null,
    note: null,
    managed_store_count: 42,
    status: 'active',
    created_at: '2024-04-01T10:00:00+09:00',
    updated_at: '2024-04-01T10:00:00+09:00',
  },
  {
    id: 'fc-005',
    formal_name: '株式会社関西フィット',
    display_name: '株式会社関西フィット',
    type: 'fc',
    direct_owned_flag: false,
    corporate_number: null,
    representative_name: null,
    head_office_address: null,
    phone: null,
    contact_person: null,
    contact_phone: null,
    fc_contract_start_date: null,
    fc_contract_renewal_date: null,
    royalty_rate: null,
    note: null,
    managed_store_count: 0,
    status: 'inactive',
    created_at: '2024-04-01T10:00:00+09:00',
    updated_at: '2024-04-01T10:00:00+09:00',
  },
];

export function buildFranchiseCompanyDetail(row: FranchiseCompanyRow): FranchiseCompanyDetail {
  return {
    id: row.id,
    formal_name: row.formal_name,
    display_name: row.display_name,
    type: row.type,
    direct_owned_flag: row.direct_owned_flag,
    corporate_number: row.corporate_number,
    representative_name: row.representative_name,
    head_office_address: row.head_office_address,
    phone: row.phone,
    contact_person: row.contact_person,
    contact_phone: row.contact_phone,
    fc_contract_start_date: row.fc_contract_start_date,
    fc_contract_renewal_date: row.fc_contract_renewal_date,
    royalty_rate: row.royalty_rate,
    note: row.note,
    managed_store_count: row.managed_store_count,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function buildFranchiseCompanyHistory(
  row: FranchiseCompanyRow,
): FranchiseCompanyHistoryItem[] {
  const createdAt = row.created_at;
  const updatedAt = row.updated_at;
  const currentTypeLabel = row.type === 'fc' ? 'FC' : '直営';
  const currentStatusLabel = row.status === 'active' ? '有効' : '無効';

  return [
    {
      updated_at: createdAt,
      operator: 'システム',
      changed_item: '新規作成',
      before: null,
      after: row.formal_name,
    },
    {
      updated_at: updatedAt,
      operator: 'システム',
      changed_item: '法人名（表示名）',
      before: row.formal_name,
      after: row.display_name,
    },
    {
      updated_at: updatedAt,
      operator: 'システム',
      changed_item: '直営 / FC',
      before: currentTypeLabel,
      after: currentTypeLabel,
    },
    {
      updated_at: updatedAt,
      operator: 'システム',
      changed_item: 'ステータス',
      before: currentStatusLabel,
      after: currentStatusLabel,
    },
  ];
}

export const SEED_ENROLLMENT_FEE_MASTERS: EnrollmentFeeMasterRow[] = [
  {
    id: 'EF001',
    name: '標準入会金',
    amount: 2200,
    brand: 'JOYFIT',
    application_type: 'normal',
    isActive: true,
  },
  {
    id: 'EF002',
    name: 'ファミリー入会金',
    amount: 1100,
    brand: 'JOYFIT',
    application_type: 'normal',
    isActive: true,
  },
  {
    id: 'EF003',
    name: '法人入会金',
    amount: 5500,
    brand: '共通',
    application_type: 'corporate',
    isActive: true,
  },
  {
    id: 'EF004',
    name: '社員割引入会金',
    amount: 0,
    brand: '共通',
    application_type: 'employee_discount',
    isActive: true,
  },
  {
    id: 'EF005',
    name: '特別契約入会金',
    amount: 0,
    brand: '共通',
    application_type: 'special_contract',
    isActive: true,
  },
];

export const SEED_CORPORATE_MASTERS: CorporateMasterRow[] = [
  { id: 'CORP-001', name: '株式会社サンプルA', code: 'CA001' },
  { id: 'CORP-002', name: '株式会社サンプルB', code: 'CB002' },
  { id: 'CORP-003', name: '株式会社サンプルC', code: 'CC003' },
];
