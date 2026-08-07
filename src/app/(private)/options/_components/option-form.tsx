'use client';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { AlertTriangle, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { BRAND_LABELS } from '@/components/common/brand-badge';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import {
  Brand,
  OptionProrataMethod,
  OptionStatus,
  OptionType,
  OptionUsageRule,
} from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import {
  OPTION_CATEGORY_LABELS,
  OPTION_STATUS_LABELS,
  OPTION_TYPE_DESCRIPTIONS,
  OPTION_TYPE_LABELS,
  OPTION_USAGE_RULE_DESCRIPTIONS,
  OPTION_USAGE_RULE_LABELS,
  PRORATA_METHOD_LABELS,
} from '../_constants/constants';
import {
  OPTION_AREA_OPTIONS,
  OPTION_METERED_TYPE_OPTIONS,
  type OptionFormSubmitValues,
  type OptionFormValues,
} from '../_schemas/option-form.schema';

// Handling uploads via S3 after the official API is released.
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });

interface OptionFormProps {
  isEdit?: boolean;
  isSubmitting?: boolean;
  optionId?: string;
  onCancel: () => void;
  onSubmit: (values: OptionFormSubmitValues) => void;
}

export function OptionForm({
  isEdit = false,
  isSubmitting = false,
  optionId,
  onCancel,
  onSubmit,
}: Readonly<OptionFormProps>) {
  const form = useFormContext<OptionFormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const optionType = useWatch({ control: form.control, name: 'option_type' });
  const proratedEnabled = useWatch({ control: form.control, name: 'prorated_enabled' });
  const memberAppImage = useWatch({ control: form.control, name: 'member_app_image' });

  useEffect(() => {
    if (optionType !== OptionType.METERED) {
      form.setValue('tsuji_type', '', { shouldDirty: true });
    }
  }, [form, optionType]);

  useEffect(() => {
    if (!proratedEnabled) {
      form.setValue('prorata_method', null, { shouldDirty: true });
    }
  }, [form, proratedEnabled]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      form.setValue('member_app_image', base64, { shouldDirty: true, shouldValidate: true });
    } catch {
      toast.error('画像の読み込みに失敗しました');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {isEdit && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="text-warning size-4" />
          <AlertDescription className="text-muted-foreground text-xs">
            料金や適用条件を変更すると、現在利用中の会員にも反映されます。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            <FormItem>
              <FormLabel>オプションID</FormLabel>
              <Input
                value={optionId ?? ''}
                placeholder="自動採番"
                disabled
                className="bg-muted/50 font-mono"
              />
              <p className="text-muted-foreground text-xs">登録時に自動で採番されます</p>
            </FormItem>

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    ブランド<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select
                    key={`brand-${field.value ?? 'empty'}`}
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="ブランドを選択">
                          {field.value ? BRAND_LABELS[field.value] : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(BRAND_LABELS) as [Brand, string][]).map(([brand, label]) => (
                        <SelectItem key={brand} value={brand}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    オプション名<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: プロテインサーバー" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    コード<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: PRO-001" className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="option_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    オプション分類<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select
                    key={`option-category-${field.value ?? 'empty'}`}
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="分類を選択">
                          {field.value ? OPTION_CATEGORY_LABELS[field.value] : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(OPTION_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accounting_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>会計コード</FormLabel>
                  <FormControl>
                    <Input placeholder="例: OPT-101" className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Textarea placeholder="備考・メモを入力してください" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6">
            <FormField
              control={form.control}
              name="member_app_image"
              render={() => (
                <FormItem>
                  <FormLabel>会員公開用画像</FormLabel>
                  <div className="flex items-start gap-3">
                    {memberAppImage ? (
                      <div className="bg-muted/50 relative flex size-30 items-center justify-center overflow-hidden rounded-lg border">
                        <Image
                          src={memberAppImage}
                          alt="会員公開用画像"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="absolute top-1 right-1 z-10 size-5 rounded-full p-0"
                          onClick={() =>
                            form.setValue('member_app_image', null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-muted-foreground/30 size-30 flex-col gap-1 border-dashed"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="text-muted-foreground size-4" />
                        <span className="text-muted-foreground text-[10px]">追加</span>
                      </Button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    会員アプリに表示される画像です。推奨: 800×600px、JPG/PNG
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">料金設定</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="price_including_tax"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    料金（税込）<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <span className="text-muted-foreground leading-none">¥</span>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1100"
                        className="pl-8"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={
                          field.value === undefined || field.value === null
                            ? ''
                            : String(field.value)
                        }
                        aria-invalid={fieldState.invalid}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_rate"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    税率<span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select
                    key={`tax-rate-${field.value ?? 'empty'}`}
                    value={field.value !== undefined ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          fieldState.invalid && 'border-destructive ring-destructive/20 ring-3',
                        )}
                      >
                        <SelectValue placeholder="税率を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="8">8%（軽減税率）</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="prorated_enabled"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <FormLabel className="text-sm">日割り要否</FormLabel>
                      <p className="text-muted-foreground text-xs">
                        月途中の入会・解約時に日割り計算を適用するか設定します
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">適用しない</span>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm font-medium">適用する</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {proratedEnabled && (
              <FormField
                control={form.control}
                name="prorata_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>日割り計算方式</FormLabel>
                    <Select
                      key={`prorata-method-${field.value ?? 'empty'}`}
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="計算方式を選択">
                            {field.value ? PRORATA_METHOD_LABELS[field.value] : undefined}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(OptionProrataMethod).map((method) => (
                          <SelectItem key={method} value={method}>
                            {PRORATA_METHOD_LABELS[method]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">オプション種別</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="option_type"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col gap-4"
                  >
                    {Object.values(OptionType).map((type) => (
                      <div key={type} className="flex items-start gap-3">
                        <RadioGroupItem
                          value={type}
                          id={`option-type-${type}`}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5">
                          <Label
                            htmlFor={`option-type-${type}`}
                            className="cursor-pointer text-sm font-medium"
                          >
                            {OPTION_TYPE_LABELS[type]}
                          </Label>
                          <p className="text-muted-foreground text-xs">
                            {OPTION_TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {optionType === OptionType.METERED && (
            <div className="mt-6 border-t pt-6">
              <FormField
                control={form.control}
                name="tsuji_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      都次オプション種別<span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <Select
                      key={`tsuji-type-${field.value ?? 'empty'}`}
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="種別を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPTION_METERED_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">利用可否ルール</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="usage_rule"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-col gap-4"
                  >
                    {Object.values(OptionUsageRule).map((rule) => (
                      <div key={rule} className="flex items-start gap-3">
                        <RadioGroupItem value={rule} id={`usage-rule-${rule}`} className="mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <Label
                            htmlFor={`usage-rule-${rule}`}
                            className="cursor-pointer text-sm font-medium"
                          >
                            {OPTION_USAGE_RULE_LABELS[rule]}
                          </Label>
                          <p className="text-muted-foreground text-xs">
                            {OPTION_USAGE_RULE_DESCRIPTIONS[rule]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-muted-foreground mt-4 text-xs">
            オプション追加時は「今日から」「翌月から」を会員が選択可能です
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">制約設定</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="constraint_main_option_change"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <FormLabel className="text-sm">主オプション契約変更可否</FormLabel>
                      <p className="text-muted-foreground text-xs">
                        主契約変更時にこのオプションの変更を許可するか設定します
                      </p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="constraint_change"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <FormLabel className="text-sm">変更可否</FormLabel>
                      <p className="text-muted-foreground text-xs">
                        会員によるオプション内容変更を許可するか設定します
                      </p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">エリア制限設定</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="area_restrictions"
            render={({ field }) => (
              <FormItem>
                {(() => {
                  const areas = field.value ?? [];

                  return (
                    <>
                      <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-xs">
                          本部が設定する施設内の設備名。対象エリアを持つ店舗でのみこのオプションが利用可能になります
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                          {OPTION_AREA_OPTIONS.map((area) => {
                            const checked = areas.includes(area);
                            return (
                              <div key={area} className="flex items-center gap-2">
                                <Checkbox
                                  id={`area-${area}`}
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    if (value) {
                                      field.onChange([...areas, area]);
                                    } else {
                                      field.onChange(areas.filter((item) => item !== area));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`area-${area}`}
                                  className="cursor-pointer text-sm font-normal"
                                >
                                  {area}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ステータス</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <FormLabel className="text-sm">オプションの有効/無効</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      有効にすると、対象の会員がこのオプションに申し込めるようになります
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      {OPTION_STATUS_LABELS[OptionStatus.INACTIVE]}
                    </span>
                    <Switch
                      checked={field.value === OptionStatus.ACTIVE}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? OptionStatus.ACTIVE : OptionStatus.INACTIVE);
                      }}
                    />
                    <span className="text-sm font-medium">
                      {OPTION_STATUS_LABELS[OptionStatus.ACTIVE]}
                    </span>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 border-t p-4">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <RoleGatedButton
          type="button"
          size="lg"
          requiredPermission={isEdit ? Permission.OptionsEdit : Permission.OptionsCreate}
          disabled={isSubmitting}
          onClick={form.handleSubmit(onSubmit as (values: OptionFormValues) => void)}
        >
          {isSubmitting ? (isEdit ? '更新中...' : '登録中...') : isEdit ? '更新する' : '登録する'}
        </RoleGatedButton>
      </div>
    </div>
  );
}
