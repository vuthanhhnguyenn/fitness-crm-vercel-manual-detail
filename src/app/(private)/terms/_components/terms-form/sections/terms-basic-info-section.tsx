'use client';

import { useFormContext } from 'react-hook-form';

import { TERMS_BRAND_LABELS, TERMS_TYPE_LABELS } from '@/app/(private)/terms/_constants/constants';
import type { TermsFormValues } from '@/app/(private)/terms/_schemas/terms-form.schema';

import { RequiredMark } from '@/components/common/field-marker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TermsBrand } from '@/lib/api/types.gen';

interface TermsBasicInfoSectionProps {
  isBrandTypeLocked: boolean;
  isCopiedFieldLocked: boolean;
}

export function TermsBasicInfoSection({
  isBrandTypeLocked,
  isCopiedFieldLocked,
}: Readonly<TermsBasicInfoSectionProps>) {
  const form = useFormContext<TermsFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4">
        <FormField
          control={form.control}
          name="brandEnum"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                ブランド
                <RequiredMark />
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                {isBrandTypeLocked
                  ? '編集モードではブランドは変更できません'
                  : '対象ブランドを選択（複数可）'}
              </p>
              <FormControl>
                <div className="grid max-w-100 grid-cols-2 gap-4">
                  {Object.values(TermsBrand).map((brand) => {
                    const checked = field.value?.includes(brand) ?? false;
                    return (
                      <div key={brand} className="flex items-center gap-2">
                        <Checkbox
                          id={`terms-brand-${brand}`}
                          checked={checked}
                          disabled={isBrandTypeLocked}
                          onCheckedChange={(next) => {
                            const current = field.value ?? [];
                            field.onChange(
                              next ? [...current, brand] : current.filter((b) => b !== brand),
                            );
                          }}
                        />
                        <Label
                          htmlFor={`terms-brand-${brand}`}
                          className={
                            isBrandTypeLocked
                              ? 'text-muted-foreground cursor-not-allowed text-sm'
                              : 'cursor-pointer text-sm'
                          }
                        >
                          {TERMS_BRAND_LABELS[brand]}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                規約名
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input placeholder="例: 利用規約" disabled={isCopiedFieldLocked} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termsType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                規約タイプ
                <RequiredMark />
              </FormLabel>
              {isBrandTypeLocked && (
                <p className="text-muted-foreground text-xs">編集モードでは変更できません</p>
              )}
              <FormControl>
                <Select
                  items={TERMS_TYPE_LABELS}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isBrandTypeLocked}
                >
                  <SelectTrigger className="max-w-75">
                    <SelectValue placeholder="規約タイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TERMS_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                バージョン
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input placeholder="例: v1.0" className="max-w-50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
