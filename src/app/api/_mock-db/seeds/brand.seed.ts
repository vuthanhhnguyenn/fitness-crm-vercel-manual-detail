import type {
  BrandChangeHistoryItem,
  BrandDetail,
  BrandFeeGroup,
  BrandListItem,
} from '@/app/api/_schemas/brand.schema';

export const SEED_BRAND_ROWS: BrandDetail[] = [
  {
    brand_id: 'joyfit',
    code: 'joyfit',
    display_name: 'JOYFIT',
    status: 'active',
    fee_group_count: 4,
    change_history_count: 3,
    created_at: '2024-04-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    created_by: 'STF-001',
    updated_by: 'STF-002',
  },
  {
    brand_id: 'fit365',
    code: 'fit365',
    display_name: 'FIT365',
    status: 'active',
    fee_group_count: 1,
    change_history_count: 1,
    created_at: '2024-04-01T00:00:00.000Z',
    updated_at: '2026-02-20T00:00:00.000Z',
    created_by: 'STF-001',
    updated_by: 'STF-001',
  },
];

export const SEED_BRAND_FEE_GROUPS: BrandFeeGroup[] = [
  {
    parent_brand_code: 'joyfit',
    parent_brand_name: 'JOYFIT',
    sub_brand_code: 'joyfit',
    sub_brand_id: 'joyfit',
    display_name: 'JOYFIT',
    status: 'active',
    fee_master_id: 'EF001',
    fee_items: [
      {
        item_code: 'enrollment-fee',
        item_name: '入会金',
        current_value_including_tax_yen: 11000,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
      {
        item_code: 'registration-admin-fee',
        item_name: '登録事務手数料',
        current_value_including_tax_yen: 3300,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
    ],
  },
  {
    parent_brand_code: 'joyfit',
    parent_brand_name: 'JOYFIT',
    sub_brand_code: 'joyfit24',
    sub_brand_id: 'joyfit24',
    display_name: 'JOYFIT24',
    status: 'active',
    fee_master_id: 'EF002',
    fee_items: [
      {
        item_code: 'enrollment-fee',
        item_name: '入会金',
        current_value_including_tax_yen: 11000,
        effective_start_date: '2025/04/01',
        scheduled_changes: [
          {
            effective_start_date: '2026/09/01',
            registered_at: '2026/06/01',
            registered_by: '山田 花子（本部）',
            value_including_tax_yen: 12000,
          },
        ],
      },
      {
        item_code: 'registration-admin-fee',
        item_name: '登録事務手数料',
        current_value_including_tax_yen: 3300,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
    ],
  },
  {
    parent_brand_code: 'joyfit',
    parent_brand_name: 'JOYFIT',
    sub_brand_code: 'joyfit_yoga',
    sub_brand_id: 'joyfit_yoga',
    display_name: 'JOYFIT YOGA',
    status: 'active',
    fee_master_id: 'EF003',
    fee_items: [
      {
        item_code: 'enrollment-fee',
        item_name: '入会金',
        current_value_including_tax_yen: 9900,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
      {
        item_code: 'registration-admin-fee',
        item_name: '登録事務手数料',
        current_value_including_tax_yen: 3300,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
    ],
  },
  {
    parent_brand_code: 'joyfit',
    parent_brand_name: 'JOYFIT',
    sub_brand_code: 'joyfit_plus',
    sub_brand_id: 'joyfit_plus',
    display_name: 'JOYFIT+',
    status: 'active',
    fee_master_id: 'EF004',
    fee_items: [
      {
        item_code: 'enrollment-fee',
        item_name: '入会金',
        current_value_including_tax_yen: 11000,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
      {
        item_code: 'registration-admin-fee',
        item_name: '登録事務手数料',
        current_value_including_tax_yen: 3300,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
    ],
  },
  {
    parent_brand_code: 'fit365',
    parent_brand_name: 'FIT365',
    sub_brand_code: 'fit365',
    sub_brand_id: 'fit365',
    display_name: 'FIT365',
    status: 'active',
    fee_master_id: 'EF101',
    fee_items: [
      {
        item_code: 'card-issuance-fee',
        item_name: 'カード発行料',
        current_value_including_tax_yen: 5000,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
      {
        item_code: 'security-maintenance-fee',
        item_name: 'セキュリティ管理費・施設メンテナンス料',
        current_value_including_tax_yen: 4980,
        effective_start_date: '2025/04/01',
        scheduled_changes: [],
      },
    ],
  },
];

export const SEED_BRAND_CHANGE_HISTORIES: Array<BrandChangeHistoryItem & { brand_code: string }> = [
  {
    brand_code: 'joyfit',
    changed_at: '2026/03/01 10:24:05',
    changed_by: '山田 花子（本部）',
    target_display_name: 'JOYFIT / JOYFIT24',
    changed_field: '入会金 定価',
    before_value: '¥10,000',
    after_value: '¥11,000',
  },
  {
    brand_code: 'joyfit',
    changed_at: '2025/10/15 14:30:22',
    changed_by: '鈴木 一郎（本部）',
    target_display_name: 'JOYFIT / JOYFIT24',
    changed_field: '有効開始日',
    before_value: '2025/10/01',
    after_value: '2025/11/01',
  },
  {
    brand_code: 'joyfit',
    changed_at: '2025/04/01 09:00:00',
    changed_by: '田中 次郎（本部）',
    target_display_name: 'JOYFIT / JOYFIT24',
    changed_field: '入会金 定価',
    before_value: '¥8,800',
    after_value: '¥10,000',
  },
  {
    brand_code: 'fit365',
    changed_at: '2026/02/20 08:30:00',
    changed_by: '山田 花子（本部）',
    target_display_name: 'FIT365 / FIT365',
    changed_field: 'カード発行料 定価',
    before_value: '¥4,800',
    after_value: '¥5,000',
  },
];

export function normalizeBrandIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function toBrandListItem(brand: BrandDetail): BrandListItem {
  return {
    brand_id: brand.brand_id,
    code: brand.code,
    display_name: brand.display_name,
    status: brand.status,
  };
}

export function cloneBrandFeeGroup(group: BrandFeeGroup): BrandFeeGroup {
  return {
    ...group,
    fee_items: group.fee_items.map((item) => ({
      ...item,
      scheduled_changes: item.scheduled_changes.map((change) => ({ ...change })),
    })),
  };
}

export function staffBrandDisplayName(code: string): string {
  const y07 = SEED_BRAND_ROWS.find((b) => b.code === code);
  if (y07) return y07.display_name;
  const fallbacks: Record<string, string> = {
    all: '全ブランド',
    joyfit24: 'JOYFIT24',
    joyfit_yoga: 'JOYFIT YOGA',
    joyfit_plus: 'JOYFIT+',
  };
  return fallbacks[code] ?? code;
}
