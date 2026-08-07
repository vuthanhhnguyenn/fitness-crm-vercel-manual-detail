import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { formatISODateLocal, parseDate } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { BRAND_OPTIONS, TERMS_TYPE_LABELS } from '../../_constants/constants';
import type { TermsFormValues } from '../../_schemas/terms-form.schema';

interface TermsFieldLabelProps {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  description?: string;
}

export function TermsFieldLabel({
  children,
  required = false,
  optional = false,
  description,
}: Readonly<TermsFieldLabelProps>) {
  return (
    <div className="flex flex-col gap-1">
      <FormLabel>
        {children}
        {required ? <span className="text-destructive ml-1">*</span> : null}
        {optional ? (
          <span className="text-muted-foreground ml-1 rounded-sm border px-1 text-[10px] leading-relaxed">
            任意
          </span>
        ) : null}
      </FormLabel>
      {description ? <FormDescription className="text-xs">{description}</FormDescription> : null}
    </div>
  );
}

interface TermsFormBasicsProps {
  lockBrandAndType: boolean;
  lockTitle: boolean;
  lockDisplayOrderAndConsent: boolean;
}

export function TermsFormBasics({
  lockBrandAndType,
  lockTitle,
  lockDisplayOrderAndConsent,
}: Readonly<TermsFormBasicsProps>) {
  const form = useFormContext<TermsFormValues>();
  const { errors } = form.formState;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="brandEnum"
            render={({ field }) => (
              <FormItem>
                <TermsFieldLabel
                  required
                  description={
                    lockBrandAndType
                      ? '編集モードではブランドは変更できません'
                      : '対象ブランドを選択（複数可）'
                  }
                >
                  ブランド
                </TermsFieldLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-x-5 gap-y-3">
                    {BRAND_OPTIONS.map((brand) => (
                      <div key={brand} className="flex items-center gap-2">
                        <Checkbox
                          id={`terms-brand-${brand}`}
                          checked={field.value.includes(brand)}
                          disabled={lockBrandAndType}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, brand]
                                : field.value.filter((value) => value !== brand),
                            );
                          }}
                        />
                        <Label htmlFor={`terms-brand-${brand}`} className="cursor-pointer text-sm">
                          {brand}
                        </Label>
                      </div>
                    ))}
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
                <TermsFieldLabel required>規約名</TermsFieldLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={lockTitle}
                    maxLength={TEXT_MAX_LENGTH}
                    placeholder="例: 利用規約"
                  />
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
                <TermsFieldLabel
                  required
                  description={
                    lockBrandAndType ? '編集時は規約タイプを変更できません。' : undefined
                  }
                >
                  規約タイプ
                </TermsFieldLabel>
                <FormControl>
                  <Select
                    value={field.value || null}
                    onValueChange={field.onChange}
                    disabled={lockBrandAndType}
                  >
                    <SelectTrigger className="w-full max-w-75">
                      <SelectValue placeholder="規約タイプを選択">
                        {field.value ? TERMS_TYPE_LABELS[field.value] : undefined}
                      </SelectValue>
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
                <TermsFieldLabel required>バージョン</TermsFieldLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="w-full max-w-50"
                    maxLength={50}
                    placeholder="例: v1.0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>適用設定</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="effectiveFrom"
            render={({ field }) => (
              <FormItem>
                <TermsFieldLabel required>適用開始日</TermsFieldLabel>
                <FormControl>
                  <DatePicker
                    date={parseDate(field.value) ?? undefined}
                    onDateChange={(date) => field.onChange(date ? formatISODateLocal(date) : '')}
                    placeholder="日付を選択"
                    hasError={Boolean(errors.effectiveFrom)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effectiveTo"
            render={({ field }) => (
              <FormItem>
                <TermsFieldLabel optional>適用終了予定日</TermsFieldLabel>
                <FormControl>
                  <DatePicker
                    date={parseDate(field.value) ?? undefined}
                    onDateChange={(date) => field.onChange(date ? formatISODateLocal(date) : null)}
                    placeholder="日付を選択"
                    hasError={Boolean(errors.effectiveTo)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <TermsFieldLabel optional>表示順</TermsFieldLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="1"
                    className="w-full max-w-30 appearance-auto"
                    disabled={lockDisplayOrderAndConsent}
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value === '' ? null : Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requiresConsent"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="min-w-0">
                    <Label className="text-sm font-medium">
                      承諾ボタン表示<span className="text-destructive ml-1">*</span>
                    </Label>
                    <p className="text-muted-foreground mt-1 text-xs">
                      ONにすると、会員に規約への同意ボタンが表示されます。
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      disabled={lockDisplayOrderAndConsent}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}
