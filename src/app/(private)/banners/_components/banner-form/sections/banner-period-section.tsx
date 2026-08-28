import type { FieldErrors } from 'react-hook-form';

import type { BannerFormValues } from '@/app/(private)/banners/_schemas/banner-form.schema';

import { FormField } from '@/components/common/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';

interface BannerPeriodSectionProps {
  formErrors: FieldErrors<BannerFormValues>;
  periodStartDate: Date | undefined;
  periodEndDate: Date | undefined;
  onDateChange: (field: 'periodStart' | 'periodEnd', date: Date | undefined) => void;
}

export function BannerPeriodSection({
  formErrors,
  periodStartDate,
  periodEndDate,
  onDateChange,
}: BannerPeriodSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">掲載期間</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            label="掲載開始日"
            required
            error={formErrors.periodStart?.message?.toString()}
          >
            <DatePicker
              date={periodStartDate}
              onDateChange={(date) => onDateChange('periodStart', date)}
              hasError={!!formErrors.periodStart}
              placeholder="日付を選択"
            />
          </FormField>

          <FormField label="掲載終了日" description="設定した日に自動的に非表示になります（任意）">
            <DatePicker
              date={periodEndDate}
              onDateChange={(date) => onDateChange('periodEnd', date)}
              placeholder="日付を選択"
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
