import { useMemo } from 'react';
import type { FieldErrors } from 'react-hook-form';

import {
  BANNER_BRAND_OPTIONS,
  BRAND_ALL_VALUE,
  type BannerBrandSelectValue,
} from '@/app/(private)/banners/_constants/banner.constants';
import type { BannerFormValues } from '@/app/(private)/banners/_schemas/banner-form.schema';
import { isAllBrandsSelected } from '@/utils/app.util';

import { FormField } from '@/components/common/form-field';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { BrandEnum } from '@/lib/api/types.gen';

interface BannerBrandSectionProps {
  formErrors: FieldErrors<BannerFormValues>;
  selectedBrands: BannerFormValues['brandEnum'];
  toggleBrand: (id: BannerBrandSelectValue) => void;
}

export function BannerBrandSection({
  formErrors,
  selectedBrands,
  toggleBrand,
}: BannerBrandSectionProps) {
  const selectedBrandBadges = useMemo(
    () =>
      selectedBrands
        .map((id) => BANNER_BRAND_OPTIONS.find((option) => option.id === id))
        .filter((option): option is (typeof BANNER_BRAND_OPTIONS)[number] => Boolean(option)),
    [selectedBrands],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">配信対象ブランド</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField
          label="対象ブランド"
          required
          description="「JOYFIT全体」を選択すると全サブブランドに配信されます。個別のサブブランドも複数選択可能です。"
          error={formErrors.brandEnum?.message?.toString()}
        >
          <div className="grid grid-cols-3 gap-3">
            {BANNER_BRAND_OPTIONS.map((option) => {
              const checked = isAllBrandsSelected(selectedBrands)
                ? option.id === BRAND_ALL_VALUE
                : selectedBrands.includes(option.id as BrandEnum);

              return (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`brand-${option.id}`}
                    checked={checked}
                    onCheckedChange={() => toggleBrand(option.id)}
                  />
                  <Label htmlFor={`brand-${option.id}`} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>

          {selectedBrandBadges.length > 0 && (
            <div className="bg-muted mt-3 rounded-md p-3">
              <p className="text-muted-foreground mb-2 text-xs">
                {selectedBrandBadges.length} ブランド選択中
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedBrandBadges.map((option) => (
                  <Badge key={option.id} variant="secondary" className="text-xs">
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
