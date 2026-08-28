import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { BannerFormValues } from '@/app/(private)/banners/_schemas/banner-form.schema';

import { FormField } from '@/components/common/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface BannerBasicInfoSectionProps {
  formErrors: FieldErrors<BannerFormValues>;
  defaultValues?: BannerFormValues;
  register: UseFormRegister<BannerFormValues>;
}

export function BannerBasicInfoSection({
  formErrors,
  defaultValues,
  register,
}: BannerBasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">バナー基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            label="タイトル（管理用）"
            required
            error={formErrors.title?.message?.toString()}
          >
            <Input
              placeholder="例: 春のキャンペーンバナー"
              defaultValue={defaultValues?.title ?? ''}
              {...register('title')}
              aria-invalid={!!formErrors.title}
            />
          </FormField>

          <FormField
            label="遷移先URL"
            description="バナークリック時に遷移するURLを入力してください（任意）"
          >
            <Input
              type="url"
              placeholder="https://www.joyfit.jp/campaign/..."
              defaultValue={defaultValues?.linkUrl ?? ''}
              {...register('linkUrl')}
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
