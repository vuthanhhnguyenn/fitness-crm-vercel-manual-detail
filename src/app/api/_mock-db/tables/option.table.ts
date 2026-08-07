import type {
  GetOptionDiscountsResponse,
  OptionDiscountChangeHistoryItem,
  OptionDiscountDetail,
  OptionDiscountListItem,
} from '@/app/api/_schemas/option-discount.schema';
import type {
  OptionMasterChangeHistoryItem,
  OptionMasterDetail,
  OptionMasterListItem,
  UpsertOptionMasterBody,
} from '@/app/api/_schemas/option-master.schema';
import type { SurveyResponseDetail } from '@/app/api/_schemas/survey-reporting.schema';
import type {
  SurveyQuestion,
  SurveyTemplateChangeHistoryItem,
  SurveyTemplateDetail,
  SurveyTemplateListItem,
  SurveyTemplateStatus,
  SurveyTemplateUpsertBody,
} from '@/app/api/_schemas/survey.schema';

import { LOCKER_CONTRACT_TYPE_DESCRIPTIONS } from '../seeds/locker.seed';
import {
  SEED_OPTION_DISCOUNT_CHANGE_HISTORY,
  SEED_OPTION_DISCOUNT_ROWS,
  buildOptionMasterChangeHistory,
  buildOptionMasterDetail,
  toOptionMasterListItem,
} from '../seeds/option.seed';
import {
  buildSurveyTemplateChangeHistory,
  buildSurveyTemplateDetail,
  toSurveyTemplateListItem,
} from '../seeds/survey.seed';

export function createOptionTables() {
  return {
    optionMasters: {
      _rows: [] as OptionMasterDetail[],
      _changeHistory: {} as Record<string, OptionMasterChangeHistoryItem[]>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        const seedRows: Array<Omit<OptionMasterListItem, 'description'>> = [
          {
            id: 'OP001',
            name: 'ドリンクバー（月額）',
            code: 'DRK-001',
            category: 'gym_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 550,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'add_remove_change',
            linked_contracts: 6,
            member_count: 310,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-101',
            status: 'active',
          },
          {
            id: 'OP002',
            name: '水素水',
            code: 'H2O-001',
            category: 'gym_option',
            brand: 'fit365',
            option_type: 'metered',
            price_including_tax: 1100,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'add_remove_change',
            linked_contracts: 10,
            member_count: 680,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-102',
            status: 'active',
          },
          {
            id: 'OP003',
            name: 'タオルセット',
            code: 'TWL-001',
            category: 'gym_option',
            brand: 'joyfit',
            option_type: 'standard',
            price_including_tax: 330,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'add_remove',
            linked_contracts: 10,
            member_count: 350,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-103',
            status: 'active',
          },
          {
            id: 'OP004',
            name: 'パーソナルロッカー（S）',
            code: 'LCK-001',
            category: 'locker_option',
            brand: 'joyfit',
            option_type: 'standard',
            price_including_tax: 550,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'add_remove_change',
            linked_contracts: 6,
            member_count: 180,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-201',
            status: 'active',
          },
          {
            id: 'OP005',
            name: 'パーソナルロッカー（L）',
            code: 'LCK-002',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 880,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'add_remove_change',
            linked_contracts: 6,
            member_count: 95,
            store_id: 'store-002',
            store_name: 'Fit365新宿店',
            accounting_code: 'OPT-202',
            status: 'active',
          },
          {
            id: 'OP006',
            name: '契約ロッカー',
            code: 'LCK-003',
            category: 'locker_option',
            brand: 'joyfit',
            option_type: 'standard',
            price_including_tax: 1100,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'change_remove',
            linked_contracts: 4,
            member_count: 60,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-203',
            status: 'active',
          },
          {
            id: 'OP007',
            name: '安心サポートプラス',
            code: 'SPT-001',
            category: 'insurance',
            brand: 'joyfit',
            option_type: 'auto_attached',
            price_including_tax: 550,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'disabled',
            linked_contracts: 8,
            member_count: 920,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-301',
            status: 'active',
          },
          {
            id: 'OP008',
            name: 'Wi-Fi利用',
            code: 'WIF-001',
            category: 'gym_option',
            brand: 'joyfit',
            option_type: 'auto_attached',
            price_including_tax: 0,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'disabled',
            linked_contracts: 10,
            member_count: 1200,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-401',
            status: 'active',
          },
          {
            id: 'OP009',
            name: 'シャワールーム優先利用',
            code: 'SHW-001',
            category: 'gym_option',
            brand: 'joyfit',
            option_type: 'metered',
            price_including_tax: 220,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'fixed',
            usage_rule: 'add_remove',
            linked_contracts: 3,
            member_count: 45,
            store_id: 'store-001',
            store_name: 'Fit365八潮店',
            accounting_code: 'OPT-402',
            status: 'inactive',
          },
          {
            id: 'OP011',
            name: 'パーソナルトレーニング（月4回）',
            code: 'PT-002',
            category: 'lesson_plan',
            brand: 'joyfit24',
            option_type: 'metered',
            price_including_tax: 22000,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'add_remove_change',
            linked_contracts: 5,
            member_count: 88,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-501',
            status: 'active',
          },
          {
            id: 'OP021',
            name: '安心サポート（当店版）',
            code: 'SPT-002',
            category: 'insurance',
            brand: 'joyfit24',
            option_type: 'auto_attached',
            price_including_tax: 660,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'disabled',
            linked_contracts: 3,
            member_count: 420,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-601',
            status: 'active',
          },
          {
            id: 'OP022',
            name: '有料駐車場チケット（当店限定）',
            code: 'PKG-001',
            category: 'other',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 1100,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'add_remove',
            linked_contracts: 0,
            member_count: 0,
            store_id: 'store-002',
            store_name: 'Fit365新宿店',
            accounting_code: 'OPT-701',
            status: 'inactive',
          },
          {
            id: 'OP023',
            name: 'プロテインサーバー',
            code: 'PRO-001',
            category: 'gym_option',
            brand: 'fit365',
            option_type: 'metered',
            price_including_tax: 1210,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'add_remove_change',
            linked_contracts: 8,
            member_count: 420,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-801',
            status: 'active',
          },
          {
            id: 'OP025',
            name: '契約ロッカーL',
            code: 'LCK-004',
            category: 'locker_option',
            brand: 'joyfit',
            option_type: 'standard',
            price_including_tax: 1650,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 4,
            member_count: 72,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-204',
            status: 'active',
          },
          {
            id: 'OP030',
            name: '安心サポートPLUS',
            code: 'SPT-003',
            category: 'insurance',
            brand: 'joyfit_plus',
            option_type: 'auto_attached',
            price_including_tax: 880,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'disabled',
            linked_contracts: 2,
            member_count: 155,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-901',
            status: 'active',
          },
          {
            id: 'OP031',
            name: 'メンテナンス会費',
            code: 'MNT-001',
            category: 'other',
            brand: 'fit365',
            option_type: 'auto_attached',
            price_including_tax: 770,
            tax_rate: 10,
            prorated_enabled: false,
            prorata_method: null,
            usage_rule: 'disabled',
            linked_contracts: 7,
            member_count: 890,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-902',
            status: 'active',
          },
          {
            id: 'OP032',
            name: '定価',
            code: 'LK-STD-001',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 1100,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 4,
            member_count: 120,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-205',
            status: 'active',
          },
          {
            id: 'OP033',
            name: '割増（プレミアム）',
            code: 'LK-PRM-001',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 1650,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 2,
            member_count: 45,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-206',
            status: 'active',
          },
          {
            id: 'OP034',
            name: '割引（最下段）',
            code: 'LK-DSC-001',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 880,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 3,
            member_count: 30,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-207',
            status: 'active',
          },
          {
            id: 'OP035',
            name: '割引（セット）',
            code: 'LK-DSC-002',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 770,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 2,
            member_count: 18,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-208',
            status: 'active',
          },
          {
            id: 'OP036',
            name: 'プレミアムロッカー',
            code: 'LK-3x9-PREMIUM-001',
            category: 'locker_option',
            brand: 'joyfit24',
            option_type: 'standard',
            price_including_tax: 1650,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 1,
            member_count: 9,
            store_id: 'store-006',
            store_name: 'JOYFIT24 新宿店',
            accounting_code: 'OPT-209',
            status: 'active',
          },
          {
            id: 'OP037',
            name: 'スタンダードロッカー',
            code: 'LK-3x6-STANDARD-001',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 1100,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 1,
            member_count: 6,
            store_id: 'store-001',
            store_name: 'Fit365八潮店',
            accounting_code: 'OPT-210',
            status: 'active',
          },
          {
            id: 'OP038',
            name: '3x9 スタンダード',
            code: 'LK-3x9-STANDARD-001',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 1100,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 1,
            member_count: 12,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-211',
            status: 'active',
          },
          {
            id: 'OP039',
            name: '3x6 プレミアム',
            code: 'LK-3x6-PREMIUM-001',
            category: 'locker_option',
            brand: 'joyfit',
            option_type: 'standard',
            price_including_tax: 1650,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 1,
            member_count: 8,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-212',
            status: 'active',
          },
          {
            id: 'OP040',
            name: '2x10 スタンダード',
            code: 'LK-2x10-STANDARD-001',
            category: 'locker_option',
            brand: 'fit365',
            option_type: 'standard',
            price_including_tax: 1100,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 1,
            member_count: 5,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-213',
            status: 'active',
          },
          {
            id: 'OP041',
            name: '2x4 スタンダード',
            code: 'LK-2x4-STANDARD-001',
            category: 'locker_option',
            brand: 'joyfit24',
            option_type: 'standard',
            price_including_tax: 880,
            tax_rate: 10,
            prorated_enabled: true,
            prorata_method: 'daily',
            usage_rule: 'change_remove',
            linked_contracts: 1,
            member_count: 4,
            store_id: null,
            store_name: null,
            accounting_code: 'OPT-214',
            status: 'active',
          },
        ];

        const popularityRanks = new Map(
          [...seedRows]
            .sort((a, b) => b.member_count - a.member_count)
            .map((row, index) => [row.id, index + 1]),
        );

        const descriptionOverrides: Record<string, string> = {
          OP023:
            '高品質プロテインを24時間いつでもご利用いただけるサーバーサービス。チョコレート・バニラ・ストロベリーの3種類のフレーバーからお選びいただけます。トレーニング前後の栄養補給に最適です。',
          OP032: LOCKER_CONTRACT_TYPE_DESCRIPTIONS['LK-STD-001'],
          OP033: LOCKER_CONTRACT_TYPE_DESCRIPTIONS['LK-PRM-001'],
          OP034: LOCKER_CONTRACT_TYPE_DESCRIPTIONS['LK-DSC-001'],
          OP035: LOCKER_CONTRACT_TYPE_DESCRIPTIONS['LK-DSC-002'],
        };

        const detailOverrides: Record<
          string,
          Partial<Omit<OptionMasterDetail, keyof OptionMasterListItem>>
        > = {
          OP022: { note: '現在利用会員が存在しないため削除可能なサンプルデータです。' },
          OP023: {
            note: '月末の在庫確認を要実施。サーバーフィルター交換は4週間ごと。',
            created_at: '2024-04-01T10:00:00+09:00',
            updated_at: '2026-02-15T14:30:00+09:00',
            popularity_rank: 3,
            tsuji_type: 'Protein',
            constraint_main_option_change: true,
            constraint_change: false,
            area_restrictions: ['プロテインバー'],
          },
        };

        this._rows.push(
          ...seedRows.map((row) =>
            buildOptionMasterDetail(
              { ...row, description: descriptionOverrides[row.id] ?? null },
              { popularity_rank: popularityRanks.get(row.id) ?? null, ...detailOverrides[row.id] },
            ),
          ),
        );

        this._changeHistory = Object.fromEntries(
          this._rows.map((row) => [row.id, buildOptionMasterChangeHistory(row)]),
        );

        this._changeHistory.OP023 = [
          {
            date: '2026/02/15 14:30',
            user: '管理者A',
            field: '説明文',
            from: '高品質プロテインを24時間ご利用いただけます。',
            to: '高品質プロテインを24時間いつでもご利用いただけるサーバーサービス。チョコレート・バニラ・ストロベリーの3種類のフレーバーからお選びいただけます。',
          },
          {
            date: '2025/10/01 09:00',
            user: '管理者B',
            field: '月額料金',
            from: '¥1,000',
            to: '¥1,100',
          },
          {
            date: '2025/04/01 10:00',
            user: '管理者C',
            field: 'ステータス',
            from: '無効',
            to: '有効',
          },
          { date: '2024/04/01 10:00', user: '管理者A', field: null, from: null, to: '新規作成' },
        ];
      },
      getList(): OptionMasterListItem[] {
        this._seed();
        return this._rows.map(toOptionMasterListItem);
      },
      getById(id: string): OptionMasterDetail | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      getByCode(code: string): OptionMasterDetail | undefined {
        this._seed();
        return this._rows.find((row) => row.code === code);
      },
      getChangeHistory(id: string): OptionMasterChangeHistoryItem[] {
        this._seed();
        return [...(this._changeHistory[id] ?? [])];
      },
      add(data: UpsertOptionMasterBody): OptionMasterDetail {
        this._seed();
        const maxNumericId = this._rows.reduce((max, row) => {
          const numericId = Number.parseInt(row.id.replace(/^OP/, ''), 10);
          return Number.isNaN(numericId) ? max : Math.max(max, numericId);
        }, 0);
        const id = `OP${String(maxNumericId + 1).padStart(3, '0')}`;
        const now = new Date().toISOString();
        const option = buildOptionMasterDetail(
          {
            id,
            name: data.name,
            code: data.code,
            category: data.category ?? 'other',
            brand: data.brand,
            option_type: data.option_type,
            price_including_tax: data.price_including_tax,
            tax_rate: data.tax_rate,
            prorated_enabled: data.prorated_enabled,
            prorata_method: data.prorata_method ?? null,
            usage_rule: data.usage_rule,
            linked_contracts: 0,
            member_count: 0,
            store_id: null,
            store_name: null,
            accounting_code: data.accounting_code,
            status: data.status,
            description: data.description ?? null,
          },
          {
            option_category: data.option_category,
            note: data.note ?? null,
            member_app_image: data.member_app_image ?? null,
            created_at: now,
            updated_at: now,
            popularity_rank: null,
            tsuji_type: data.tsuji_type ?? null,
            constraint_main_option_change: data.constraint_main_option_change,
            constraint_change: data.constraint_change,
            area_restrictions: data.area_restrictions,
          },
        );
        this._rows.unshift(option);
        return option;
      },
      update(id: string, data: UpsertOptionMasterBody): OptionMasterDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return undefined;
        const existing = this._rows[index];
        const now = new Date().toISOString();
        const updated = buildOptionMasterDetail(
          {
            ...toOptionMasterListItem(existing),
            name: data.name,
            code: data.code,
            category: data.category ?? existing.category,
            brand: data.brand,
            option_type: data.option_type,
            price_including_tax: data.price_including_tax,
            tax_rate: data.tax_rate,
            prorated_enabled: data.prorated_enabled,
            prorata_method: data.prorata_method ?? null,
            usage_rule: data.usage_rule,
            accounting_code: data.accounting_code,
            status: data.status,
            description: data.description ?? existing.description,
          },
          {
            option_category: data.option_category,
            store_range: existing.store_range,
            note: data.note ?? null,
            member_app_image: data.member_app_image ?? null,
            created_at: existing.created_at,
            updated_at: now,
            popularity_rank: existing.popularity_rank,
            tsuji_type: data.tsuji_type ?? null,
            constraint_main_option_change: data.constraint_main_option_change,
            constraint_change: data.constraint_change,
            area_restrictions: data.area_restrictions,
          },
        );
        this._rows[index] = updated;
        return updated;
      },
      delete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return false;
        this._rows.splice(index, 1);
        delete this._changeHistory[id];
        return true;
      },
    },

    surveys: {
      _rows: [] as SurveyTemplateDetail[],
      _changeHistory: {} as Record<string, SurveyTemplateChangeHistoryItem[]>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;

        const surveyQuestions: Record<string, SurveyQuestion[]> = {
          'S-001': [
            {
              no: 1,
              content: '入会のきっかけを教えてください',
              format: 'multiple_choice',
              required: true,
              has_responses: true,
              choices: [
                { order: 1, text: '友人の紹介' },
                { order: 2, text: 'Web広告' },
                { order: 3, text: 'チラシ' },
                { order: 4, text: '通りがかり' },
                { order: 5, text: 'その他' },
              ],
            },
            {
              no: 2,
              content: '主に利用したい時間帯はいつですか？',
              format: 'single_choice',
              required: true,
              has_responses: true,
              choices: [
                { order: 1, text: '平日午前' },
                { order: 2, text: '平日午後' },
                { order: 3, text: '平日夜間' },
                { order: 4, text: '土日祝' },
              ],
            },
            {
              no: 3,
              content: '運動経験を教えてください',
              format: 'single_choice',
              required: true,
              has_responses: true,
              choices: [
                { order: 1, text: '初心者' },
                { order: 2, text: '1年未満' },
                { order: 3, text: '1〜3年' },
                { order: 4, text: '3年以上' },
              ],
            },
            {
              no: 4,
              content: '当ジムに期待することを教えてください',
              format: 'free_text',
              required: false,
              has_responses: false,
              choices: [],
            },
            {
              no: 5,
              content: 'ご意見・ご要望（自由記入）',
              format: 'free_text',
              required: false,
              has_responses: false,
              choices: [],
            },
          ],
          'S-002': [
            {
              no: 1,
              content: '退会を検討した主な理由を教えてください',
              format: 'single_choice',
              required: true,
              has_responses: true,
              choices: [
                { order: 1, text: '料金' },
                { order: 2, text: '通いにくさ' },
                { order: 3, text: 'サービス内容' },
                { order: 4, text: '転居' },
                { order: 5, text: 'その他' },
              ],
            },
            {
              no: 2,
              content: '改善してほしい点があれば教えてください',
              format: 'free_text',
              required: false,
              has_responses: false,
              choices: [],
            },
          ],
          'S-003': [
            {
              no: 1,
              content: '施設の清潔さに満足していますか？',
              format: 'single_choice',
              required: true,
              has_responses: true,
              choices: [
                { order: 1, text: '非常に満足' },
                { order: 2, text: '満足' },
                { order: 3, text: '普通' },
                { order: 4, text: '不満' },
              ],
            },
            {
              no: 2,
              content: '自由記述でご意見をお聞かせください',
              format: 'free_text',
              required: false,
              has_responses: false,
              choices: [],
            },
          ],
          'S-004': [
            {
              no: 1,
              content: 'トレーナーの説明は分かりやすかったですか？',
              format: 'single_choice',
              required: true,
              has_responses: true,
              choices: [
                { order: 1, text: '非常に分かりやすい' },
                { order: 2, text: '分かりやすい' },
                { order: 3, text: '普通' },
                { order: 4, text: '分かりにくい' },
              ],
            },
          ],
        };

        const seedRows: SurveyTemplateListItem[] = [
          {
            id: 'S-001',
            name: '入会時アンケート',
            type: 'lifecycle',
            trigger: 'join',
            brand: 'joyfit',
            question_count: 5,
            response_count: 1840,
            response_rate: 78.4,
            last_response_date: '2026/03/10',
            status: 'active',
          },
          {
            id: 'S-002',
            name: '退会理由アンケート',
            type: 'lifecycle',
            trigger: 'leave',
            brand: 'fit365',
            question_count: 8,
            response_count: 420,
            response_rate: 92.1,
            last_response_date: '2026/03/08',
            status: 'active',
          },
          {
            id: 'S-003',
            name: '施設満足度調査',
            type: 'operational',
            trigger: 'manual_delivery',
            brand: 'joyfit',
            question_count: 10,
            response_count: 1560,
            response_rate: 65.3,
            last_response_date: '2026/03/05',
            status: 'active',
          },
          {
            id: 'S-004',
            name: 'トレーナー評価',
            type: 'operational',
            trigger: 'conditional_trigger',
            brand: 'fit365',
            question_count: 6,
            response_count: 410,
            response_rate: 55.8,
            last_response_date: '2026/02/28',
            status: 'inactive',
          },
        ];

        const detailOverrides: Record<
          string,
          Partial<Omit<SurveyTemplateDetail, keyof SurveyTemplateListItem>>
        > = {
          'S-001': {
            created_at: '2024/04/01',
            updated_at: '2026/03/10',
            questions: surveyQuestions['S-001'],
          },
          'S-002': {
            created_at: '2024/08/01',
            updated_at: '2026/03/08',
            questions: surveyQuestions['S-002'],
          },
          'S-003': {
            created_at: '2025/01/15',
            updated_at: '2026/03/05',
            questions: surveyQuestions['S-003'],
          },
          'S-004': {
            created_at: '2025/03/01',
            updated_at: '2026/02/28',
            questions: surveyQuestions['S-004'],
          },
        };

        this._rows.push(
          ...seedRows.map((row) => buildSurveyTemplateDetail(row, detailOverrides[row.id])),
        );
        this._changeHistory = Object.fromEntries(
          this._rows.map((row) => [row.id, buildSurveyTemplateChangeHistory(row)]),
        );
      },
      getList(): SurveyTemplateListItem[] {
        this._seed();
        return this._rows.map(toSurveyTemplateListItem);
      },
      getById(id: string): SurveyTemplateDetail | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      getChangeHistory(id: string): SurveyTemplateChangeHistoryItem[] {
        this._seed();
        return this._changeHistory[id] ?? [];
      },
      delete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return false;
        this._rows.splice(index, 1);
        delete this._changeHistory[id];
        return true;
      },
      add(data: SurveyTemplateUpsertBody): SurveyTemplateDetail {
        this._seed();
        const nextNumber = this._rows.reduce((max, row) => {
          const numeric = Number.parseInt(row.id.replace(/^S-/, ''), 10);
          return Number.isFinite(numeric) && numeric > max ? numeric : max;
        }, 0);
        const id = `S-${String(nextNumber + 1).padStart(3, '0')}`;
        const now = new Date().toLocaleDateString('ja-JP').replaceAll('-', '/');
        const created = buildSurveyTemplateDetail(
          {
            id,
            name: data.name,
            type: data.type,
            trigger: data.trigger,
            brand: data.brand,
            question_count: data.questions.length,
            response_count: 0,
            response_rate: 0,
            last_response_date: null,
            status: data.status,
          },
          {
            created_at: now,
            updated_at: now,
            questions: data.questions.map((question) => ({
              ...question,
              has_responses: question.has_responses ?? false,
              choices: question.choices.map((choice) => ({ ...choice })),
            })) as SurveyQuestion[],
          },
        );
        this._rows.push(created);
        this._changeHistory[id] = [
          { date: `${now} 10:00`, user: '管理者A', field: null, from: null, to: '新規作成' },
        ];
        return created;
      },
      update(id: string, data: SurveyTemplateUpsertBody): SurveyTemplateDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return undefined;
        const existing = this._rows[index]!;
        const now = new Date().toLocaleDateString('ja-JP').replaceAll('-', '/');
        const updated: SurveyTemplateDetail = {
          ...existing,
          name: data.name,
          type: data.type,
          trigger: data.trigger,
          brand: data.brand,
          status: data.status,
          question_count: data.questions.length,
          updated_at: now,
          questions: data.questions.map((question) => ({
            ...question,
            has_responses: question.has_responses ?? false,
            choices: question.choices.map((choice) => ({ ...choice })),
          })) as SurveyQuestion[],
        };
        this._rows[index] = updated;
        this._changeHistory[id] = [
          {
            date: `${now} 10:00`,
            user: '管理者A',
            field: 'フォーム',
            from: existing.name,
            to: data.name,
          },
          ...(this._changeHistory[id] ?? []),
        ];
        return updated;
      },
      updateStatus(
        id: string,
        status: SurveyTemplateStatus,
        reason?: string | null,
      ): SurveyTemplateDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return undefined;
        const existing = this._rows[index]!;
        const nextUpdatedAt =
          status === 'inactive'
            ? '2026/06/11'
            : new Date().toLocaleDateString('ja-JP').replaceAll('-', '/');
        const updated = { ...existing, status, updated_at: nextUpdatedAt };
        this._rows[index] = updated;
        this._changeHistory[id] = [
          {
            date: `${nextUpdatedAt} 10:00`,
            user: '管理者A',
            field: reason ? 'ステータス / 理由' : 'ステータス',
            from: existing.status === 'active' ? '有効' : '無効',
            to: reason
              ? `${status === 'active' ? '有効' : '無効'} (${reason})`
              : status === 'active'
                ? '有効'
                : '無効',
          },
          ...(this._changeHistory[id] ?? []),
        ];
        return updated;
      },
    },

    surveyReporting: {
      _rows: [
        {
          id: 'R-001',
          response_date: '2026/03/10 14:32',
          member_id: 'M-00001',
          member_number: 'M-00001',
          member_name: '田中 太郎',
          survey_id: 'S-001',
          survey_name: '入会時アンケート',
          template_type: 'lifecycle',
          brand: 'fit365',
          store_id: 'store-001',
          store_name: 'FIT365八潮店',
          member_type: 'regular',
          answered_count: 5,
          total_count: 5,
          status: 'completed',
          answers: [
            {
              question_no: 1,
              question: '入会のきっかけを教えてください',
              format: 'multiple_choice',
              answer: ['友人の紹介', 'Web広告'],
            },
            {
              question_no: 2,
              question: '主に利用したい時間帯はいつですか？',
              format: 'single_choice',
              answer: ['平日夜間'],
            },
            {
              question_no: 3,
              question: '運動経験を教えてください',
              format: 'single_choice',
              answer: ['1〜3年'],
            },
            {
              question_no: 4,
              question: '当ジムに期待することを教えてください',
              format: 'free_text',
              answer: ['清潔さと通いやすさ'],
            },
            {
              question_no: 5,
              question: 'ご意見・ご要望（自由記入）',
              format: 'free_text',
              answer: ['夜の混雑が少し気になります'],
            },
          ],
        },
        {
          id: 'R-002',
          response_date: '2026/03/08 09:10',
          member_id: 'M-00002',
          member_number: 'M-00002',
          member_name: '佐藤 花子',
          survey_id: 'S-001',
          survey_name: '入会時アンケート',
          template_type: 'lifecycle',
          brand: 'fit365',
          store_id: 'store-001',
          store_name: 'FIT365八潮店',
          member_type: 'family',
          answered_count: 3,
          total_count: 5,
          status: 'partial',
          answers: [
            {
              question_no: 1,
              question: '入会のきっかけを教えてください',
              format: 'multiple_choice',
              answer: ['チラシ'],
            },
            {
              question_no: 2,
              question: '主に利用したい時間帯はいつですか？',
              format: 'single_choice',
              answer: ['平日午前'],
            },
            {
              question_no: 4,
              question: '当ジムに期待することを教えてください',
              format: 'free_text',
              answer: ['子どもと一緒に通いやすい環境'],
            },
          ],
        },
        {
          id: 'R-003',
          response_date: '2026/03/05 17:55',
          member_id: 'M-00003',
          member_number: 'M-00003',
          member_name: '鈴木 一郎',
          survey_id: 'S-002',
          survey_name: '退会時アンケート',
          template_type: 'lifecycle',
          brand: 'joyfit',
          store_id: 'store-002',
          store_name: 'JOYFIT大宮店',
          member_type: 'regular',
          answered_count: 2,
          total_count: 2,
          status: 'completed',
          answers: [
            {
              question_no: 1,
              question: '退会を検討した主な理由を教えてください',
              format: 'single_choice',
              answer: ['通いにくさ'],
            },
            {
              question_no: 2,
              question: '改善してほしい点があれば教えてください',
              format: 'free_text',
              answer: ['朝の時間帯の混雑緩和'],
            },
          ],
        },
      ] as SurveyResponseDetail[],
      _seeded: true,
      _seed(): void {
        return;
      },
      getAll(): SurveyResponseDetail[] {
        return this._rows;
      },
      getById(id: string): SurveyResponseDetail | undefined {
        return this._rows.find((row) => row.id === id);
      },
    },

    optionDiscount: {
      _rows: [] as GetOptionDiscountsResponse['option_discounts'],
      _changeHistory: {} as Record<string, OptionDiscountChangeHistoryItem[]>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_OPTION_DISCOUNT_ROWS.map((row) => ({
          ...row,
          target_contracts: [...row.target_contracts],
          target_options: [...row.target_options],
        }));
        this._changeHistory = {};
        for (const [id, history] of Object.entries(SEED_OPTION_DISCOUNT_CHANGE_HISTORY)) {
          this._changeHistory[id] = history.map((h) => ({ ...h }));
        }
      },
      getList(): GetOptionDiscountsResponse['option_discounts'] {
        this._seed();
        return this._rows.map((row) => ({
          ...row,
          target_contracts: [...row.target_contracts],
          target_options: [...row.target_options],
        }));
      },
      getById(id: string): OptionDiscountDetail | undefined {
        this._seed();
        const row = this._rows.find((item) => item.id === id);
        if (!row) return undefined;
        return {
          ...row,
          target_contracts: [...row.target_contracts],
          target_options: [...row.target_options],
          description:
            'レギュラー会員プランと水素水オプションを同時にお申し込みいただくと、月額料金から¥330を割引いたします。既存会員がオプションを追加する場合も適用対象となります。',
          rules: [
            '常時募集（キャンペーンとは別物）',
            'セット内片方オプションの解除で割引解除、再追加で再適用',
            'キャンペーン併用時、金額変動オプションがあれば不発動',
          ],
          created_at: '2025/06/20 16:45',
          updated_at: '2026/03/01 10:30',
          updated_by: 'テストユーザー',
        };
      },
      delete(id: string): boolean {
        this._seed();
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return false;
        this._rows.splice(idx, 1);
        delete this._changeHistory[id];
        return true;
      },
      getChangeHistory(id: string): OptionDiscountChangeHistoryItem[] {
        this._seed();
        return this._changeHistory[id] ?? [];
      },
      add(data: {
        name: string;
        code: string;
        description?: string | null;
        target_contracts: string[];
        target_options: string[];
        discount_type: string;
        discount_value: number;
        conditions: string;
        store_id?: string | null;
        status?: string;
      }): OptionDiscountDetail {
        this._seed();
        const newId = `SD${String(this._rows.length + 1).padStart(3, '0')}`;
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
        const entry: OptionDiscountListItem = {
          id: newId,
          name: data.name,
          code: data.code,
          target_contracts: [...data.target_contracts],
          target_options: [...data.target_options],
          discount_type: data.discount_type as 'fixed_amount' | 'percentage',
          discount_value: data.discount_value,
          conditions: data.conditions as
            | 'simultaneous'
            | 'existing_member'
            | 'family_2_plus'
            | 'options_3_plus',
          store_id: data.store_id ?? null,
          store_name: null,
          applied_count: 0,
          status: (data.status ?? 'active') as 'active' | 'inactive',
        };
        this._rows.push(entry);
        return {
          ...entry,
          target_contracts: [...entry.target_contracts],
          target_options: [...entry.target_options],
          description: data.description ?? null,
          rules: [],
          created_at: now,
          updated_at: now,
          updated_by: 'テストユーザー',
        };
      },
      update(
        id: string,
        data: {
          name?: string;
          code?: string;
          description?: string | null;
          target_contracts?: string[];
          target_options?: string[];
          discount_type?: string;
          discount_value?: number;
          conditions?: string;
          store_id?: string | null;
          status?: string;
        },
      ): OptionDiscountDetail | undefined {
        this._seed();
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return undefined;
        const existing = this._rows[idx];
        const updated: OptionDiscountListItem = {
          ...existing,
          name: data.name ?? existing.name,
          code: data.code ?? existing.code,
          target_contracts: data.target_contracts
            ? [...data.target_contracts]
            : [...existing.target_contracts],
          target_options: data.target_options
            ? [...data.target_options]
            : [...existing.target_options],
          discount_type: (data.discount_type ?? existing.discount_type) as
            | 'fixed_amount'
            | 'percentage',
          discount_value: data.discount_value ?? existing.discount_value,
          conditions: (data.conditions ?? existing.conditions) as
            | 'simultaneous'
            | 'existing_member'
            | 'family_2_plus'
            | 'options_3_plus',
          store_id: data.store_id !== undefined ? data.store_id : existing.store_id,
          status: (data.status ?? existing.status) as 'active' | 'inactive',
        };
        this._rows[idx] = updated;
        return this.getById(id);
      },
    },
  };
}
