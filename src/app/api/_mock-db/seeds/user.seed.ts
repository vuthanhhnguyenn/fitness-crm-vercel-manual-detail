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
  },
  {
    id: 'U-006',
    email: 'area-manager@example.com',
    password: 'password123',
    name: 'Area Manager',
    position: 'テリトリーマネージャー',
    role: 'Manager',
  },
  {
    id: 'U-007',
    email: 'store-manager@example.com',
    password: 'password123',
    name: 'Store Manager',
    position: '店舗責任者',
    staff_id: 'STF-005',
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
    role: 'Trainer',
  },
  {
    id: 'U-005',
    email: 'observer@example.com',
    password: 'password123',
    name: 'Observer',
    position: '閲覧専任',
    role: 'Observer',
  },
];
