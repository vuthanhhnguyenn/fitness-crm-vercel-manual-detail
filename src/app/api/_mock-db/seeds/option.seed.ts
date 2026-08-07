import type {
  OptionDiscountChangeHistoryItem,
  OptionDiscountListItem,
} from '@/app/api/_schemas/option-discount.schema';
import type {
  OptionCategory,
  OptionMasterChangeHistoryItem,
  OptionMasterDetail,
  OptionMasterListItem,
} from '@/app/api/_schemas/option-master.schema';

export function inferOptionTsujiType(option: OptionMasterListItem): string | null {
  if (option.option_type !== 'metered') return null;
  if (option.code.startsWith('PRO')) return 'Protein';
  if (option.code.startsWith('H2O')) return 'Hydrogen Water';
  if (option.code.startsWith('PT')) return 'Personal Training';
  if (option.code.startsWith('SHW')) return 'Shower';
  return 'Metered';
}

export function inferOptionAreaRestrictions(option: OptionMasterListItem): string[] {
  if (option.code.startsWith('PRO')) return ['プロテインバー'];
  if (option.code.startsWith('LCK')) return ['ロッカーエリア'];
  if (option.code.startsWith('SHW')) return ['シャワールーム'];
  if (option.code.startsWith('PT')) return ['パーソナルトレーニングエリア'];
  return [];
}

export function inferOptionCategory(
  option: Pick<OptionMasterListItem, 'code' | 'name'>,
): OptionCategory {
  if (option.code.startsWith('LCK')) return 'locker';
  if (option.code.startsWith('SPT')) return 'insurance';
  if (option.code.startsWith('TWL')) return 'rental';
  if (
    option.code.startsWith('PRO') ||
    option.code.startsWith('DRK') ||
    option.code.startsWith('H2O')
  ) {
    return 'drink';
  }
  if (
    option.code.startsWith('SHW') ||
    option.code.startsWith('WIF') ||
    option.code.startsWith('MNT')
  ) {
    return 'service';
  }
  if (option.name.includes('サプリ')) return 'supplement';
  return 'service';
}

export function toOptionMasterListItem(option: OptionMasterDetail): OptionMasterListItem {
  return {
    id: option.id,
    name: option.name,
    code: option.code,
    category: option.category,
    brand: option.brand,
    option_type: option.option_type,
    price_including_tax: option.price_including_tax,
    tax_rate: option.tax_rate,
    prorated_enabled: option.prorated_enabled,
    prorata_method: option.prorata_method,
    usage_rule: option.usage_rule,
    linked_contracts: option.linked_contracts,
    member_count: option.member_count,
    store_id: option.store_id,
    store_name: option.store_name,
    accounting_code: option.accounting_code,
    status: option.status,
    description: option.description,
  };
}

export function buildOptionMasterDetail(
  option: OptionMasterListItem,
  overrides: Partial<Omit<OptionMasterDetail, keyof OptionMasterListItem>> = {},
): OptionMasterDetail {
  const priceExcludingTax = Math.round(option.price_including_tax / (1 + option.tax_rate / 100));
  const changeAllowed =
    option.usage_rule === 'add_remove_change' || option.usage_rule === 'change_remove';

  return {
    ...option,
    price_excluding_tax: overrides.price_excluding_tax ?? priceExcludingTax,
    option_category: overrides.option_category ?? inferOptionCategory(option),
    store_range:
      overrides.store_range ??
      (option.store_name ? `${option.store_name}（1店舗）` : '全店舗（12店舗）'),
    description:
      option.description ??
      `${option.name}をご利用いただけるオプションサービスです。ご利用条件は契約内容に準じます。`,
    note: overrides.note ?? (option.store_name ? `${option.store_name}限定オプションです。` : null),
    member_app_image: overrides.member_app_image ?? null,
    created_at: overrides.created_at ?? '2024-04-01T10:00:00+09:00',
    updated_at: overrides.updated_at ?? '2026-01-15T14:30:00+09:00',
    popularity_rank: overrides.popularity_rank ?? null,
    tsuji_type: overrides.tsuji_type ?? inferOptionTsujiType(option),
    constraint_main_option_change:
      overrides.constraint_main_option_change ?? option.option_type !== 'auto_attached',
    constraint_change: overrides.constraint_change ?? changeAllowed,
    area_restrictions: overrides.area_restrictions ?? inferOptionAreaRestrictions(option),
  };
}

export function buildOptionMasterChangeHistory(
  option: OptionMasterDetail,
): OptionMasterChangeHistoryItem[] {
  const currentStatus = option.status === 'active' ? '有効' : '無効';
  const previousStatus = option.status === 'active' ? '無効' : '有効';

  return [
    {
      date: '2026/02/15 14:30',
      user: '管理者A',
      field: '説明文',
      from: `${option.name}をご利用いただけるオプションです。`,
      to: option.description ?? `${option.name}をご利用いただけるオプションサービスです。`,
    },
    {
      date: '2025/10/01 09:00',
      user: '管理者B',
      field: '月額料金',
      from: `¥${Math.max(option.price_excluding_tax - 100, 0).toLocaleString()}`,
      to: `¥${option.price_excluding_tax.toLocaleString()}`,
    },
    {
      date: '2025/04/01 10:00',
      user: '管理者C',
      field: 'ステータス',
      from: previousStatus,
      to: currentStatus,
    },
    {
      date: '2024/04/01 10:00',
      user: '管理者A',
      field: null,
      from: null,
      to: '新規作成',
    },
  ];
}

export const SEED_OPTION_DISCOUNT_CHANGE_HISTORY: Record<
  string,
  OptionDiscountChangeHistoryItem[]
> = {
  SD001: [
    {
      date: '2026/03/01 10:30',
      user: 'テストユーザー',
      field: '割引金額',
      from: '¥220',
      to: '¥330',
    },
    {
      date: '2025/10/15 14:00',
      user: '管理者A',
      field: '適用条件',
      from: '新規入会時のみ',
      to: '同時申込時',
    },
    {
      date: '2025/07/01 09:00',
      user: '管理者A',
      field: 'ステータス',
      from: 'inactive',
      to: 'active',
    },
    { date: '2025/06/20 16:45', user: 'テストユーザー', field: null, from: null, to: '新規作成' },
  ],
  SD002: [
    { date: '2026/02/15 14:30', user: '管理者A', field: '割引金額', from: '¥250', to: '¥220' },
    { date: '2025/08/10 11:00', user: 'テストユーザー', field: null, from: null, to: '新規作成' },
  ],
  SD003: [
    { date: '2025/12/01 09:00', user: '管理者A', field: '割引率', from: '5%', to: '10%' },
    { date: '2025/09/20 16:45', user: 'テストユーザー', field: null, from: null, to: '新規作成' },
  ],
  SD004: [
    { date: '2026/01/10 13:00', user: 'テストユーザー', field: null, from: null, to: '新規作成' },
  ],
  SD005: [{ date: '2025/11/05 10:00', user: '管理者A', field: null, from: null, to: '新規作成' }],
};

export const SEED_OPTION_DISCOUNT_ROWS: OptionDiscountListItem[] = [
  {
    id: 'SD001',
    name: 'レギュラー＋水素水セット',
    code: 'SET-001',
    target_contracts: ['レギュラー会員'],
    target_options: ['水素水'],
    discount_type: 'fixed_amount',
    discount_value: 330,
    conditions: 'simultaneous',
    store_id: null,
    store_name: null,
    applied_count: 180,
    status: 'active',
  },
  {
    id: 'SD002',
    name: 'レギュラー＋プロテインセット',
    code: 'SET-002',
    target_contracts: ['レギュラー会員'],
    target_options: ['プロテインサーバー'],
    discount_type: 'fixed_amount',
    discount_value: 220,
    conditions: 'simultaneous',
    store_id: null,
    store_name: null,
    applied_count: 95,
    status: 'active',
  },
  {
    id: 'SD003',
    name: 'ファミリー＋ロッカーセット',
    code: 'SET-003',
    target_contracts: ['ファミリー会員（親）', 'ファミリー会員（子・大人）'],
    target_options: ['パーソナルロッカー（S）'],
    discount_type: 'percentage',
    discount_value: 10,
    conditions: 'family_2_plus',
    store_id: null,
    store_name: null,
    applied_count: 42,
    status: 'active',
  },
  {
    id: 'SD004',
    name: 'デイタイム＋タオルセット',
    code: 'SET-004',
    target_contracts: ['デイタイム会員'],
    target_options: ['タオルセット'],
    discount_type: 'fixed_amount',
    discount_value: 110,
    conditions: 'simultaneous',
    store_id: 'store-001',
    store_name: 'Fit365八潮店',
    applied_count: 65,
    status: 'active',
  },
  {
    id: 'SD005',
    name: 'プレミアム全部入りセット',
    code: 'SET-005',
    target_contracts: ['シニア午前会員'],
    target_options: ['水素水', 'プロテインサーバー', 'タオルセット'],
    discount_type: 'fixed_amount',
    discount_value: 550,
    conditions: 'options_3_plus',
    store_id: null,
    store_name: null,
    applied_count: 0,
    status: 'inactive',
  },
];
