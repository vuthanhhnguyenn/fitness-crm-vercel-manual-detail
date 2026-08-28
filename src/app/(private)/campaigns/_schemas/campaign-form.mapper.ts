import type {
  BrandEnum,
  CampaignDetailResponse,
  CampaignDiscountType,
  CampaignOptionDiscountInput,
  CreateCampaignBody,
} from '@/lib/api/types.gen';

import {
  CAMPAIGN_FORM_DEFAULT_VALUES,
  type CampaignFormValues,
  type DiscountRowValues,
  EMPTY_DISCOUNT_ROW,
} from './campaign-form.schema';

function toNumberOrNull(value: string): number | null {
  return value === '' ? null : Number(value);
}

function discountTypeOf(row: DiscountRowValues): CampaignDiscountType | null {
  if (row.amount !== '') return 'fixed_amount';
  if (row.rate !== '') return 'percentage';
  return null;
}

function discountValueOf(row: DiscountRowValues): number | null {
  if (row.amount !== '') return Number(row.amount);
  if (row.rate !== '') return Number(row.rate);
  return null;
}

function emptyOptionDiscount(optionId: string): CampaignOptionDiscountInput {
  return {
    optionId,
    discountMonth1: false,
    discountMonth1Type: null,
    discountMonth1Value: null,
    discountMonth2: false,
    discountMonth2Type: null,
    discountMonth2Value: null,
  };
}

/**
 * フォームは「初月／翌月」それぞれに対象行を持つ V0 の形。
 * API は主契約の割引 (plan*) とオプション割引の配列に分かれるため、ここで畳み込む。
 * 初月・翌月は API 側でも別々の type/value を持つため、月ごとに独立して書き込む
 * (同じ対象を両月で異なる値にしても、どちらの入力も失われない)。
 */
function buildDiscountPayload(values: CampaignFormValues) {
  const firstRows = values.discountFirstMonthEnabled ? values.discountRowsFirst : [];
  const secondRows = values.discountSecondMonthEnabled ? values.discountRowsSecond : [];

  const planFirst = firstRows.find((row) => row.target === 'plan');
  const planSecond = secondRows.find((row) => row.target === 'plan');

  const optionMap = new Map<string, CampaignOptionDiscountInput>();
  const collectOptions = (
    rows: DiscountRowValues[],
    monthFlag: 'discountMonth1' | 'discountMonth2',
    typeKey: 'discountMonth1Type' | 'discountMonth2Type',
    valueKey: 'discountMonth1Value' | 'discountMonth2Value',
  ) => {
    rows
      .filter((row) => row.target === 'option' && row.optionId)
      .forEach((row) => {
        const existing = optionMap.get(row.optionId) ?? emptyOptionDiscount(row.optionId);
        optionMap.set(row.optionId, {
          ...existing,
          [monthFlag]: true,
          [typeKey]: discountTypeOf(row),
          [valueKey]: discountValueOf(row),
        });
      });
  };
  collectOptions(firstRows, 'discountMonth1', 'discountMonth1Type', 'discountMonth1Value');
  collectOptions(secondRows, 'discountMonth2', 'discountMonth2Type', 'discountMonth2Value');

  return {
    planDiscountMonth1: planFirst !== undefined,
    planDiscountMonth1Type: planFirst ? discountTypeOf(planFirst) : null,
    planDiscountMonth1Value: planFirst ? discountValueOf(planFirst) : null,
    planDiscountMonth2: planSecond !== undefined,
    planDiscountMonth2Type: planSecond ? discountTypeOf(planSecond) : null,
    planDiscountMonth2Value: planSecond ? discountValueOf(planSecond) : null,
    campaignOptionDiscounts: [...optionMap.values()],
  };
}

export function toCampaignRequestBody(values: CampaignFormValues): CreateCampaignBody {
  return {
    brandEnum: values.brandEnum,
    name: values.name,
    campaignCode: values.campaignCode === '' ? null : values.campaignCode,
    remarks: values.remarks === '' ? null : values.remarks,
    isAccepting: values.isAccepting,
    recruitmentStart: values.recruitmentStart,
    recruitmentEnd: values.recruitmentEnd,
    usageStart: values.usageStart || null,
    usageEnd: values.usageEnd || null,
    applyStartMonth: values.applyStartMonth,
    applyStartSpecificN:
      values.applyStartMonth === 'specific_month'
        ? toNumberOrNull(values.applyStartSpecificN)
        : null,
    applyDurationMonths: toNumberOrNull(values.applyDurationMonths),
    planId: values.planId,
    ...buildDiscountPayload(values),
    campaignAutoOptions: values.autoGrantEnabled
      ? values.autoGrantOptionIds.map((optionId) => ({
          optionId,
          targetSexes: values.autoGrantTarget === 'conditional' ? values.autoGrantSexes : null,
        }))
      : [],
    entryCap: toNumberOrNull(values.entryCap),
    lockInMonths: toNumberOrNull(values.lockInMonths),
    publishScope: values.publishScope,
    publishStoreIds: values.publishScope === 'specific_stores' ? values.publishStoreIds : [],
    conditionOptionIds: values.conditionOptionIds,
    referral: {
      enabled: values.referralEnabled,
      points: values.referralEnabled ? toNumberOrNull(values.referralPoints) : null,
      tieredIncrease: values.referralEnabled && values.referralTieredIncrease,
      tierThreshold:
        values.referralEnabled && values.referralTieredIncrease
          ? toNumberOrNull(values.referralTierThreshold)
          : null,
      tierPoints:
        values.referralEnabled && values.referralTieredIncrease
          ? toNumberOrNull(values.referralTierPoints)
          : null,
      annualReset: values.referralAnnualReset,
    },
  };
}

/** 詳細レスポンスをフォームの初期値に戻す。編集・複製の双方から使う。 */
export function toCampaignFormValues(campaign: CampaignDetailResponse): CampaignFormValues {
  const planRow = (
    monthFlag: 'planDiscountMonth1' | 'planDiscountMonth2',
    type: CampaignDetailResponse['planDiscountMonth1Type'],
    value: number | null,
  ): DiscountRowValues[] =>
    campaign[monthFlag]
      ? [
          {
            target: 'plan' as const,
            optionId: '',
            amount: type === 'fixed_amount' && value !== null ? String(value) : '',
            rate: type === 'percentage' && value !== null ? String(value) : '',
          },
        ]
      : [];

  const optionRows = (
    monthFlag: 'discountMonth1' | 'discountMonth2',
    typeKey: 'discountMonth1Type' | 'discountMonth2Type',
    valueKey: 'discountMonth1Value' | 'discountMonth2Value',
  ): DiscountRowValues[] =>
    campaign.campaignOptionDiscounts
      .filter((entry) => entry[monthFlag])
      .map((entry) => ({
        target: 'option' as const,
        optionId: entry.optionId,
        amount:
          entry[typeKey] === 'fixed_amount' && entry[valueKey] !== null
            ? String(entry[valueKey])
            : '',
        rate:
          entry[typeKey] === 'percentage' && entry[valueKey] !== null
            ? String(entry[valueKey])
            : '',
      }));

  const firstRows = [
    ...planRow(
      'planDiscountMonth1',
      campaign.planDiscountMonth1Type,
      campaign.planDiscountMonth1Value,
    ),
    ...optionRows('discountMonth1', 'discountMonth1Type', 'discountMonth1Value'),
  ];
  const secondRows = [
    ...planRow(
      'planDiscountMonth2',
      campaign.planDiscountMonth2Type,
      campaign.planDiscountMonth2Value,
    ),
    ...optionRows('discountMonth2', 'discountMonth2Type', 'discountMonth2Value'),
  ];

  const autoOptionSexes = campaign.campaignAutoOptions.find(
    (entry) => entry.targetSexes !== null,
  )?.targetSexes;

  return {
    ...CAMPAIGN_FORM_DEFAULT_VALUES,
    name: campaign.name,
    campaignCode: campaign.campaignCode ?? '',
    brandEnum: campaign.brandEnum as BrandEnum,
    entryCap: campaign.entryCap === null ? '' : String(campaign.entryCap),
    lockInMonths: campaign.lockInMonths === null ? '' : String(campaign.lockInMonths),
    remarks: campaign.remarks ?? '',
    publishScope: campaign.publishScope,
    publishStoreIds: campaign.publishStores.map((store) => store.storeId),
    recruitmentStart: campaign.recruitmentStart,
    recruitmentEnd: campaign.recruitmentEnd,
    usageStart: campaign.usageStart ?? '',
    usageEnd: campaign.usageEnd ?? '',
    applyStartMonth: campaign.applyStartMonth ?? 'first_month',
    applyStartSpecificN:
      campaign.applyStartSpecificN === null ? '' : String(campaign.applyStartSpecificN),
    applyDurationMonths:
      campaign.applyDurationMonths === null ? '' : String(campaign.applyDurationMonths),
    planId: campaign.planId,
    conditionOptionIds: campaign.conditionOptions.map((option) => option.optionId),
    discountFirstMonthEnabled: firstRows.length > 0,
    discountRowsFirst: firstRows.length > 0 ? firstRows : [EMPTY_DISCOUNT_ROW],
    discountSecondMonthEnabled: secondRows.length > 0,
    discountRowsSecond: secondRows.length > 0 ? secondRows : [EMPTY_DISCOUNT_ROW],
    referralEnabled: campaign.referral.enabled,
    referralPoints: campaign.referral.points === null ? '' : String(campaign.referral.points),
    referralTieredIncrease: campaign.referral.tieredIncrease,
    referralTierThreshold:
      campaign.referral.tierThreshold === null ? '' : String(campaign.referral.tierThreshold),
    referralTierPoints:
      campaign.referral.tierPoints === null ? '' : String(campaign.referral.tierPoints),
    referralAnnualReset: campaign.referral.annualReset,
    autoGrantEnabled: campaign.campaignAutoOptions.length > 0,
    autoGrantTarget: autoOptionSexes ? 'conditional' : 'all',
    autoGrantSexes: autoOptionSexes ?? [],
    autoGrantOptionIds: campaign.campaignAutoOptions.map((entry) => entry.optionId),
    isAccepting: campaign.isAccepting,
  };
}

/**
 * G-03 FR-S003 複製: 全設定をコピーし、名称に「（コピー）」を付与、
 * 誤公開防止のため受付可否は停止で初期化する。
 */
export function toDuplicatedFormValues(campaign: CampaignDetailResponse): CampaignFormValues {
  return {
    ...toCampaignFormValues(campaign),
    name: `${campaign.name}（コピー）`,
    campaignCode: '',
    isAccepting: false,
  };
}
