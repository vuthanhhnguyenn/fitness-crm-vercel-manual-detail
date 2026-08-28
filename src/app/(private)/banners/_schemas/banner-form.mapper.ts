import {
  type BannerItemResponse,
  type CreateBannerBody,
  type UpdateBannerBody,
} from '@/lib/api/types.gen';

import type { BannerFormSubmitValues, BannerFormValues } from './banner-form.schema';

export function bannerDetailToFormValues(banner: BannerItemResponse): BannerFormValues {
  return {
    title: banner.title,
    imageUrl: banner.imageUrl,
    brandEnum: banner.brandEnum,
    linkUrl: banner.linkUrl,
    periodStart: banner.periodStart,
    periodEnd: banner.periodEnd,
    webEnabled: banner.webEnabled,
    mobileEnabled: banner.mobileEnabled,
    order: banner.order,
  };
}

export function bannerFormValuesToCreateBody(
  values: BannerFormSubmitValues,
): NonNullable<CreateBannerBody> {
  return {
    title: values.title,
    imageUrl: values.imageUrl,
    brandEnum: values.brandEnum,
    linkUrl: values.linkUrl ?? null,
    periodStart: values.periodStart,
    periodEnd: values.periodEnd ?? null,
    webEnabled: values.webEnabled,
    mobileEnabled: values.mobileEnabled,
    order: values.order,
  };
}

export function bannerFormValuesToUpdateBody(
  values: BannerFormSubmitValues,
): NonNullable<UpdateBannerBody> {
  return {
    title: values.title,
    imageUrl: values.imageUrl,
    brandEnum: values.brandEnum,
    linkUrl: values.linkUrl ?? null,
    periodStart: values.periodStart,
    periodEnd: values.periodEnd ?? null,
    webEnabled: values.webEnabled,
    mobileEnabled: values.mobileEnabled,
    order: values.order,
  };
}
