import { db } from '@/app/api/_mock-db';
import type {
  CampaignDetail,
  CampaignGenderCondition,
  CampaignPromoCodePreviewItem,
  CampaignUpsertAutoGrant,
  CampaignUpsertDiscount,
  UpsertCampaignBody,
} from '@/app/api/_schemas/campaign.schema';

function toDisplayDate(value: string): string {
  return value.replaceAll('-', '/');
}

function getAcceptStatusMessage(status: CampaignDetail['accept_status']): string {
  return status === 'active'
    ? '受付中です。募集期間内の新規申請を受け付けています。'
    : '受付停止中です。現在は新規受付を行っていません。';
}

function getAcceptStatusActionLabel(status: CampaignDetail['accept_status']): string {
  return status === 'active' ? '受付を停止する' : '受付を再開する';
}

function getApplicationStartMonthLabel(input: UpsertCampaignBody): string {
  switch (input.application_start_month_type) {
    case 'first_month':
      return '初月（利用開始月）';
    case 'next_month':
      return '翌月（利用開始月の翌月）';
    case 'custom_month':
      return `${input.application_custom_month ?? 1}ヶ月目から`;
    default:
      return '初月（利用開始月）';
  }
}

function getGenderLabel(gender: CampaignGenderCondition): string {
  switch (gender) {
    case 'male':
      return '男性';
    case 'female':
      return '女性';
    case 'other':
      return 'その他';
    default:
      return gender;
  }
}

function buildDiscountDisplay(
  discount: CampaignUpsertDiscount,
): Pick<CampaignDetail['discount'], 'title' | 'description' | 'value_text'> {
  const amountText = discount.amount !== null ? `${discount.amount.toLocaleString()}円引き` : null;
  const rateText = discount.rate !== null ? `${discount.rate}% OFF` : null;
  const baseText = amountText ?? rateText ?? '設定なし';

  return {
    title: '月額割引',
    description: discount.first_month_enabled ? `初月 ${baseText}` : '設定なし',
    value_text: discount.second_month_enabled ? `翌月 ${baseText}` : '設定なし',
  };
}

function buildAutoGrantTargetText(autoGrant: CampaignUpsertAutoGrant): string {
  if (!autoGrant.enabled) return '―';
  if (autoGrant.target_type === 'all') return '全員';
  if (autoGrant.gender_conditions.length === 0) return '条件あり';
  return autoGrant.gender_conditions.map(getGenderLabel).join(' / ');
}

function buildAutoGrantDescription(
  optionNames: string[],
  autoGrant: CampaignUpsertAutoGrant,
): string {
  if (!autoGrant.enabled) return '自動付与は設定されていません。';
  if (optionNames.length === 0) return '条件を満たした会員に自動付与します。';
  return `条件を満たした会員に ${optionNames.join(' / ')} を自動付与します。`;
}

function buildPromoCodePreviewRows(campaignId: string): CampaignPromoCodePreviewItem[] {
  return db.promoCodes.getListByCampaignId(campaignId).map((promoCode) => ({
    code: promoCode.code,
    description: promoCode.description,
    valid_from: promoCode.valid_from,
    valid_to: promoCode.valid_to,
    status: promoCode.status,
  }));
}

export function buildCampaignDetail(
  id: string,
  input: UpsertCampaignBody,
  actor: string,
  existing?: CampaignDetail,
): CampaignDetail {
  const now = new Date();
  const nowDisplay = now.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const mainContract = db.mainContracts.getById(input.main_contract_id);
  const optionNames = input.auto_grant.option_ids
    .map((optionId) => db.optionMasters.getById(optionId)?.name)
    .filter((name): name is string => Boolean(name));
  const discountDisplay = buildDiscountDisplay(input.discount);

  const recruitmentPeriodStart = toDisplayDate(input.recruitment_period_start);
  const recruitmentPeriodEnd = toDisplayDate(input.recruitment_period_end);
  const usagePeriodStart = toDisplayDate(input.usage_period_start);
  const usagePeriodEnd = toDisplayDate(input.usage_period_end);

  return {
    id,
    name: input.name,
    code: input.code,
    brand: input.brand,
    note: input.note ?? null,
    accept_status: input.accept_status,
    status: input.status,
    accept_status_message: getAcceptStatusMessage(input.accept_status),
    accept_status_action_label: getAcceptStatusActionLabel(input.accept_status),
    main_contract_name: mainContract?.name ?? input.main_contract_id,
    main_contract_id: input.main_contract_id,
    recruitment_period_start: recruitmentPeriodStart,
    recruitment_period_end: recruitmentPeriodEnd,
    usage_period_start: usagePeriodStart,
    usage_period_end: usagePeriodEnd,
    application_period_start: getApplicationStartMonthLabel(input),
    application_period_end: `${input.application_duration_months}ヶ月`,
    application_start_month_type: input.application_start_month_type,
    application_custom_month: input.application_custom_month ?? null,
    application_duration_months: input.application_duration_months,
    discount: {
      ...discountDisplay,
      first_month_enabled: input.discount.first_month_enabled,
      second_month_enabled: input.discount.second_month_enabled,
      amount: input.discount.amount,
      rate: input.discount.rate,
    },
    periods: [
      {
        period_type: 'recruitment',
        label: '募集期間',
        start_date: recruitmentPeriodStart,
        end_date: recruitmentPeriodEnd,
      },
      {
        period_type: 'usage',
        label: '利用開始期間',
        start_date: usagePeriodStart,
        end_date: usagePeriodEnd,
      },
      {
        period_type: 'application',
        label: 'キャンペーン適用期間',
        start_date: getApplicationStartMonthLabel(input),
        end_date: `${input.application_duration_months}ヶ月`,
      },
    ],
    auto_grant: {
      enabled: input.auto_grant.enabled,
      title: '自動付与設定',
      timing_text: input.auto_grant.enabled ? '会員登録完了後 即時' : '手動適用',
      target_text: buildAutoGrantTargetText(input.auto_grant),
      description: buildAutoGrantDescription(optionNames, input.auto_grant),
      target_type: input.auto_grant.target_type,
      gender_conditions: input.auto_grant.gender_conditions,
      option_ids: input.auto_grant.option_ids,
      option_names: optionNames,
    },
    stats: existing?.stats ?? {
      applied_member_count: 0,
      application_count: 0,
      monthly_new_application_count: 0,
    },
    metadata: {
      created_at: existing?.metadata.created_at ?? nowDisplay,
      created_by: existing?.metadata.created_by ?? actor,
      updated_at: nowDisplay,
      updated_by: actor,
    },
    promo_code_previews: [
      ...(existing?.promo_code_previews ?? []),
      ...buildPromoCodePreviewRows(id),
    ].reduce<CampaignPromoCodePreviewItem[]>((acc, item) => {
      if (acc.some((row) => row.code === item.code)) {
        return acc.map((row) => (row.code === item.code ? item : row));
      }

      acc.push(item);
      return acc;
    }, []),
  };
}
