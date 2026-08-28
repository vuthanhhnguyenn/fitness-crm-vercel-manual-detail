import type { UseFormRegister } from 'react-hook-form';

import type { BannerFormValues } from '@/app/(private)/banners/_schemas/banner-form.schema';

import { FormField } from '@/components/common/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface BannerOrderSectionProps {
  defaultValues?: BannerFormValues;
  register: UseFormRegister<BannerFormValues>;
}

export function BannerOrderSection({ defaultValues, register }: BannerOrderSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">表示順</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField label="表示順" description="数値が小さいほど先に表示されます">
          <Input
            type="number"
            min={1}
            placeholder="例: 1"
            className="max-w-30"
            defaultValue={defaultValues?.order ?? ''}
            {...register('order', {
              setValueAs: (value) => {
                if (value === '') return undefined;
                return Number(value);
              },
            })}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
