import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

import { AppVersionBrandEnum } from '@/lib/api/types.gen';

const VERSION_NAME_REGEX = /^\d+\.\d+\.\d+$/;

export const AppVersionFormSchema = z.object({
  brandEnum: z.enum(AppVersionBrandEnum, { error: 'ブランドを選択してください。' }),
  iosVersionName: z
    .string()
    .regex(VERSION_NAME_REGEX, 'iOSバージョンは X.Y.Z 形式で入力してください。'),
  iosBuildNumber: z.coerce
    .number({ error: 'iOSビルド番号は1以上の整数を入力してください。' })
    .int('iOSビルド番号は1以上の整数を入力してください。')
    .min(1, 'iOSビルド番号は1以上の整数を入力してください。'),
  androidVersionName: z
    .string()
    .regex(VERSION_NAME_REGEX, 'Androidバージョンは X.Y.Z 形式で入力してください。'),
  androidBuildNumber: z.coerce
    .number({ error: 'Androidビルド番号は1以上の整数を入力してください。' })
    .int('Androidビルド番号は1以上の整数を入力してください。')
    .min(1, 'Androidビルド番号は1以上の整数を入力してください。'),
  releaseDate: z.string().min(1, 'リリース日を選択してください。'),
  remarks: z
    .string()
    .max(TEXTAREA_MAX_LENGTH, '備考は1000文字以内で入力してください。')
    .default(''),
});

export type AppVersionFormValues = z.input<typeof AppVersionFormSchema>;
export type AppVersionFormSubmitValues = z.output<typeof AppVersionFormSchema>;

export const emptyAppVersionFormValues: AppVersionFormValues = {
  brandEnum: AppVersionBrandEnum.JOYFIT,
  iosVersionName: '',
  iosBuildNumber: undefined,
  androidVersionName: '',
  androidBuildNumber: undefined,
  releaseDate: '',
  remarks: '',
};
