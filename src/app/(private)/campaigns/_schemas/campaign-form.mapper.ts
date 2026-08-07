import type { CampaignDetail } from '@/lib/api/types.gen';

import type { CampaignFormSubmitValues, CampaignFormValues } from './campaign-form.schema';

function toFormDate(value: string): string {
  return value.replaceAll('/', '-');
}

export function campaignDetailToFormValues(detail: CampaignDetail): CampaignFormValues {
  return {
    name: detail.name,
    code: detail.code,
    brand: detail.brand,
    accept_status: detail.accept_status,
    note: detail.note ?? '',
    recruitment_period_start: toFormDate(detail.recruitment_period_start),
    recruitment_period_end: toFormDate(detail.recruitment_period_end),
    usage_period_start: toFormDate(detail.usage_period_start),
    usage_period_end: toFormDate(detail.usage_period_end),
    application_start_month_type: detail.application_start_month_type,
    application_custom_month: detail.application_custom_month,
    application_duration_months: detail.application_duration_months,
    main_contract_id: detail.main_contract_id,
    discount: {
      first_month_enabled: detail.discount.first_month_enabled,
      second_month_enabled: detail.discount.second_month_enabled,
      amount: detail.discount.amount,
      rate: detail.discount.rate,
    },
    auto_grant: {
      enabled: detail.auto_grant.enabled,
      target_type: detail.auto_grant.target_type,
      gender_conditions: detail.auto_grant.gender_conditions,
      option_ids: detail.auto_grant.option_ids,
    },
    status: detail.status,
  };
}

export function campaignFormValuesToRequestBody(values: CampaignFormSubmitValues) {
  return {
    ...values,
    note: values.note.trim() || null,
    application_custom_month:
      values.application_start_month_type === 'custom_month'
        ? values.application_custom_month
        : null,
    auto_grant: {
      ...values.auto_grant,
      target_type: values.auto_grant.enabled ? values.auto_grant.target_type : 'all',
      gender_conditions:
        values.auto_grant.enabled && values.auto_grant.target_type === 'conditional'
          ? values.auto_grant.gender_conditions
          : [],
      option_ids: values.auto_grant.enabled ? values.auto_grant.option_ids : [],
    },
  };
}
