export interface EnrollmentFeeMasterRow {
  id: string;
  name: string;
  amount: number;
  brand: string;
  application_type: string;
  isActive: boolean;
}

export interface UserRow {
  id: string;
  email: string;
  password: string;
  name: string;
  position: string;
  staff_id?: string;
  role: 'System' | 'Headquarter' | 'Manager' | 'Staff' | 'Trainer' | 'Observer';
  /**
   * Store IDs a Manager oversees (their 所轄店舗 / territory span). Only meaningful for the
   * `Manager` role — B-01 権限マトリクス scopes Managers to managed stores only, so `getAllowedStoreIds`
   * resolves Manager access from this list instead of granting all stores.
   */
  managed_store_ids?: string[];
}

export interface FranchiseCompanyRow {
  id: string;
  formal_name: string;
  display_name: string;
  type: 'direct' | 'fc';
  direct_owned_flag: boolean;
  corporate_number: string | null;
  representative_name: string | null;
  head_office_address: string | null;
  phone: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  fc_contract_start_date: string | null;
  fc_contract_renewal_date: string | null;
  royalty_rate: number | null;
  note: string | null;
  auth_method: 'google_sso' | 'idaas';
  managed_store_count: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export const SEED_USERS: UserRow[] = [
  {
    id: 'U-000',
    email: 'system@example.com',
    password: 'password123',
    name: 'System',
    position: 'システム管理者',
    role: 'System',
  },
  {
    id: 'U-001',
    email: 'admin@example.com',
    password: 'password123',
    name: 'Headquarter',
    position: '本部管理者',
    role: 'Headquarter',
  },
  {
    id: 'U-003',
    email: 'manager@example.com',
    password: 'password123',
    name: 'Manager',
    position: 'ブロック長',
    role: 'Manager',
    // Block manager oversees the whole 関東 block (all kanto-area stores).
    managed_store_ids: [
      'store-001',
      'store-002',
      'store-003',
      'store-004',
      'store-005',
      'store-006',
    ],
  },
  {
    id: 'U-006',
    email: 'area-manager@example.com',
    password: 'password123',
    name: 'Area Manager',
    position: 'テリトリーマネージャー',
    role: 'Manager',
    // Territory manager oversees a smaller cluster within the block.
    managed_store_ids: ['store-001', 'store-002', 'store-003'],
  },
  {
    id: 'U-007',
    email: 'store-manager@example.com',
    password: 'password123',
    name: 'Store Manager',
    position: '店舗責任者',
    staff_id: 'STF-006',
    role: 'Staff',
  },
  {
    id: 'U-002',
    email: 'staff@example.com',
    password: 'password123',
    name: 'Fulltime Staff',
    position: '正社員スタッフ',
    staff_id: 'STF-001',
    role: 'Staff',
  },
  {
    id: 'U-008',
    email: 'fc-staff@example.com',
    password: 'password123',
    name: 'FC Staff',
    position: 'FC企業管理者',
    staff_id: 'STF-010',
    role: 'Staff',
  },
  {
    id: 'U-004',
    email: 'trainer@example.com',
    password: 'password123',
    name: 'Trainer',
    position: '社員トレーナー',
    staff_id: 'STF-003',
    role: 'Trainer',
  },
  {
    id: 'U-005',
    email: 'observer@example.com',
    password: 'password123',
    name: 'Observer',
    position: '閲覧専任',
    staff_id: 'STF-022',
    role: 'Observer',
  },
];
