import type {
  AppVersionRecord,
  CreateAppVersionBody,
  UpdateAppVersionBody,
} from '@/lib/api/types.gen';

import type { AppVersionFormSubmitValues, AppVersionFormValues } from './app-version-form.schema';

export function appVersionRecordToFormValues(record: AppVersionRecord): AppVersionFormValues {
  return {
    brandEnum: record.brandEnum,
    iosVersionName: record.iosVersionName,
    iosBuildNumber: record.iosBuildNumber,
    androidVersionName: record.androidVersionName,
    androidBuildNumber: record.androidBuildNumber,
    releaseDate: record.releaseDate,
    remarks: record.remarks ?? '',
  };
}

export function appVersionFormValuesToCreateBody(
  values: AppVersionFormSubmitValues,
): NonNullable<CreateAppVersionBody> {
  return {
    brandEnum: values.brandEnum,
    iosVersionName: values.iosVersionName,
    iosBuildNumber: values.iosBuildNumber,
    androidVersionName: values.androidVersionName,
    androidBuildNumber: values.androidBuildNumber,
    releaseDate: values.releaseDate,
    remarks: values.remarks === '' ? null : values.remarks,
  };
}

export function appVersionFormValuesToUpdateBody(
  values: AppVersionFormSubmitValues,
): NonNullable<UpdateAppVersionBody> {
  return {
    brandEnum: values.brandEnum,
    iosVersionName: values.iosVersionName,
    iosBuildNumber: values.iosBuildNumber,
    androidVersionName: values.androidVersionName,
    androidBuildNumber: values.androidBuildNumber,
    releaseDate: values.releaseDate,
    remarks: values.remarks === '' ? null : values.remarks,
  };
}
