import {
  STORE_BRAND_LABELS,
  STORE_STATUS_LABELS,
} from '@/app/(private)/stores/_constants/constants';

import { FranchiseCompanyStatus, FranchiseCompanyType, StoreListBrand } from '@/lib/api/types.gen';

import {
  FRANCHISE_COMPANY_STATUS_LABELS,
  FRANCHISE_COMPANY_TYPE_LABELS,
} from '../../_constants/constants';

export const FRANCHISE_COMPANY_BASIC_INFO_LABELS = {
  id: 'FC企業ID',
  formal_name: '法人名（正式名称）',
  display_name: '法人名（表示名）',
  type: '直営 / FC',
  direct_owned_flag: '直営店フラグ',
  status: 'ステータス',
  corporate_number: '法人番号',
  representative_name: '代表者名',
  head_office_address: '本社所在地',
  phone: '電話番号',
  contact_person: '担当者名',
  contact_phone: '担当者連絡先',
  fc_contract_start_date: 'FC契約開始日',
  fc_contract_renewal_date: 'FC契約更新日',
  royalty_rate: 'ロイヤリティ率',
  note: '備考',
  created_at: '作成日時',
  updated_at: '更新日時',
} as const;

export const FRANCHISE_COMPANY_HISTORY_LABELS = {
  updated_at: '日時',
  operator: '操作者',
  changed_item: '変更内容',
  before: '変更前',
  after: '変更後',
} as const;

export const FRANCHISE_COMPANY_LINKED_STORE_LABELS = {
  store_id: '店舗ID',
  name: '店舗名',
  brand: 'ブランド',
  prefecture: '都道府県',
  status: 'ステータス',
} as const;

export const FRANCHISE_COMPANY_LINKED_STORE_COLUMNS = [
  'store_id',
  'name',
  'brand',
  'prefecture',
  'status',
] as const;

export const STORE_BRAND_COLUMN_LABELS = STORE_BRAND_LABELS;
export const STORE_STATUS_COLUMN_LABELS = STORE_STATUS_LABELS;

export const FRANCHISE_COMPANY_DETAIL_FIELD_ORDER = [
  'id',
  'formal_name',
  'display_name',
  'type',
  'direct_owned_flag',
  'status',
  'corporate_number',
  'representative_name',
  'head_office_address',
  'phone',
  'contact_person',
  'contact_phone',
  'fc_contract_start_date',
  'fc_contract_renewal_date',
  'royalty_rate',
  'note',
  'created_at',
  'updated_at',
] as const;

export const FRANCHISE_COMPANY_TYPE_DISPLAY_LABELS: Record<FranchiseCompanyType, string> =
  FRANCHISE_COMPANY_TYPE_LABELS;
export const FRANCHISE_COMPANY_STATUS_DISPLAY_LABELS: Record<FranchiseCompanyStatus, string> =
  FRANCHISE_COMPANY_STATUS_LABELS;
export const STORE_BRAND_DISPLAY_LABELS: Record<StoreListBrand, string> = STORE_BRAND_LABELS;
