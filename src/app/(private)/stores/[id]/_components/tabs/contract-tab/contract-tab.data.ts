import {
  type StoreMainContract,
  type StoreOption,
  storeContractTabDataSchema,
} from './_schemas/contract-tab.schema';

export const CONTRACT_TYPE_LABELS: Record<StoreMainContract['contract_type'], string> = {
  general: '通常会員',
  oneDay: '1Day',
  family: 'ファミリー',
  kids: 'キッズ',
  student: '学生',
  corporate: '法人',
  welfare: '福利厚生',
  prepaid: 'プリペイド',
  special: '特殊契約',
};

export type MasterSource = 'hq' | 'store';

export type MainContractCatalogItem = StoreMainContract & {
  source: MasterSource;
};

export type OptionCatalogItem = StoreOption & {
  source: MasterSource;
};

export const MASTER_SOURCE_META: Record<MasterSource, { label: string; className: string }> = {
  hq: {
    label: '本部作成',
    className: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700',
  },
  store: {
    label: '店舗限定',
    className: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 hover:text-sky-700',
  },
};

export const CONTRACT_TAB_MOCK_DATA = storeContractTabDataSchema.parse({
  main_contracts: [
    {
      id: 'MC001',
      name: 'レギュラー会員',
      contract_type: 'general',
      price_including_tax: 7700,
      linked_at: '2024/04/01',
    },
    {
      id: 'MC001-A',
      name: 'レギュラー会員（学生）',
      contract_type: 'general',
      price_including_tax: 5500,
      linked_at: '2024/04/01',
    },
    {
      id: 'MC002',
      name: 'ナイト会員',
      contract_type: 'general',
      price_including_tax: 5500,
      linked_at: '2024/04/01',
    },
    {
      id: 'MC003',
      name: 'デイタイム会員',
      contract_type: 'general',
      price_including_tax: 6600,
      linked_at: '2024/04/01',
    },
    {
      id: 'MC005',
      name: 'シニア会員（当店限定）',
      contract_type: 'general',
      price_including_tax: 4400,
      linked_at: '2024/06/01',
    },
  ],
  options: [
    {
      id: 'OP002',
      name: '水素水',
      related_option_name: null,
      price_including_tax: 1100,
    },
    {
      id: 'OP003',
      name: 'タオルセット',
      related_option_name: null,
      price_including_tax: 330,
    },
    {
      id: 'OP006',
      name: '契約ロッカー',
      related_option_name: null,
      price_including_tax: 1100,
    },
    {
      id: 'OP011',
      name: 'パーソナルトレーニング（月4回）',
      related_option_name: 'パーソナル',
      price_including_tax: 22000,
    },
    {
      id: 'OP021',
      name: '安心サポート（当店版）',
      related_option_name: null,
      price_including_tax: 660,
    },
  ],
});

export const MAIN_CONTRACT_CATALOG: MainContractCatalogItem[] = [
  ...CONTRACT_TAB_MOCK_DATA.main_contracts.map((item) => ({ ...item, source: 'hq' as const })),
  {
    id: 'MC007',
    name: '1Day利用',
    contract_type: 'oneDay',
    price_including_tax: 1650,
    linked_at: '2024/07/01',
    source: 'hq',
  },
  {
    id: 'MC010',
    name: 'スタッフ会員（当店限定）',
    contract_type: 'special',
    price_including_tax: 0,
    linked_at: '2024/06/01',
    source: 'store',
  },
];

export const OPTION_CATALOG: OptionCatalogItem[] = [
  ...CONTRACT_TAB_MOCK_DATA.options.map((item) => ({ ...item, source: 'hq' as const })),
  {
    id: 'OP001',
    name: 'ドリンクバー（月額）',
    related_option_name: null,
    price_including_tax: 550,
    source: 'hq',
  },
  {
    id: 'OP007',
    name: 'パーソナルトレーニング（月2回）',
    related_option_name: 'パーソナル',
    price_including_tax: 13200,
    source: 'hq',
  },
  {
    id: 'OP022',
    name: '有料駐車場チケット（当店限定）',
    related_option_name: null,
    price_including_tax: 1100,
    source: 'store',
  },
];
