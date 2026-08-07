'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
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

import { cn } from '@/lib/utils';

import { UserRole } from '@/types/permission.type';

import {
  PROMO_CODE_STORE_SCOPE_LABELS,
  PROMO_CODE_USAGE_CAP_MODE_LABELS,
} from '../_constants/promo-code.constants';
import {
  type PromoCodeIssuanceDraft,
  buildPromoCodeIssuanceSchema,
  normalizePromoCodeValue,
} from '../_schemas/promo-code-issuance.schema';
import { type PromoCodeListRowStatus } from './promo-code-table';

interface CampaignOption {
  id: string;
  name: string;
  code?: string;
}

export interface PromoCodeIssuanceResult {
  code: string;
  description: string | null;
  campaignId: string;
  campaignName: string;
  usageCapMode: 'unlimited' | 'limited';
  validFrom: string;
  validTo: string;
  usageCount: number;
  usageCap: number | null;
  usageCapLabel: string;
  storeScope: 'all' | 'branch';
  remainingLabel: string;
  storeScopeLabel: string;
  issuedByLabel: string;
  status: PromoCodeListRowStatus;
}

interface PromoCodeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignOptions: CampaignOption[];
  defaultCampaignId: string;
  defaultCampaignCode: string;
  existingCodes: readonly string[];
  currentRole: UserRole;
  onCreate: (result: PromoCodeIssuanceResult) => Promise<boolean> | boolean;
}

function formatAutoCodePrefix(campaignCode: string): string {
  const normalized = normalizePromoCodeValue(campaignCode).replace(/[^A-Z0-9]/g, '');
  const prefix = normalized.slice(0, 5);
  return prefix || 'STR01';
}

function generateUniquePromoCode(campaignCode: string, existingCodes: readonly string[]): string {
  const prefix = formatAutoCodePrefix(campaignCode);
  const existing = new Set(existingCodes.map(normalizePromoCodeValue));
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 20; attempt += 1) {
    let suffix = '';
    for (let index = 0; index < 5; index += 1) {
      suffix += chars[Math.floor(Math.random() * chars.length)]!;
    }

    const candidate = `${prefix}-${suffix}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
  }

  return `${prefix}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export function PromoCodeCreateDialog({
  open,
  onOpenChange,
  campaignOptions,
  defaultCampaignId,
  defaultCampaignCode,
  existingCodes,
  currentRole,
  onCreate,
}: PromoCodeCreateDialogProps) {
  const schema = useMemo(() => buildPromoCodeIssuanceSchema(existingCodes), [existingCodes]);
  const canChooseGlobalScope =
    currentRole === UserRole.System ||
    currentRole === UserRole.Headquarter ||
    currentRole === UserRole.Manager;

  const form = useForm<PromoCodeIssuanceDraft, unknown, PromoCodeIssuanceDraft>({
    resolver: zodResolver(schema) as never,
    mode: 'onChange',
    defaultValues: {
      campaignId: defaultCampaignId,
      codeMode: 'manual',
      code: '',
      description: '',
      validFrom: '',
      validTo: '',
      usageCapMode: 'unlimited',
      usageCap: '',
      storeScope: 'branch',
    },
  });
  const scrollToFirstError = useScrollToFirstError();
  const [campaignIdValue, usageCapMode, validFrom, validTo] = useWatch({
    control: form.control,
    name: ['campaignId', 'usageCapMode', 'validFrom', 'validTo'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCampaign =
    campaignOptions.find((option) => option.id === campaignIdValue) ?? campaignOptions[0];
  const campaignName = selectedCampaign?.name ?? '';
  const campaignCode = selectedCampaign?.code ?? defaultCampaignCode;
  const validFromDate = validFrom ? new Date(`${validFrom}T00:00:00`) : undefined;
  const validToDate = validTo ? new Date(`${validTo}T00:00:00`) : undefined;

  const onSubmit = form.handleSubmit(async (parsed) => {
    const usageCapLabel =
      parsed.usageCapMode === 'unlimited' ? '無制限' : `${Number(parsed.usageCap)}回`;
    const usageCap = parsed.usageCapMode === 'unlimited' ? null : Number(parsed.usageCap);
    const storeScopeLabel =
      parsed.storeScope === 'all' ? 'タイプA: 全店舗で使用可能' : 'タイプB: 発行店舗のみで使用可能';
    const issuedByLabel = currentRole === UserRole.Staff ? '店舗スタッフ' : '本部';

    setIsSubmitting(true);
    try {
      const created = await onCreate({
        code: normalizePromoCodeValue(parsed.code),
        description: parsed.description.trim() ? parsed.description.trim() : null,
        campaignId: parsed.campaignId,
        campaignName,
        usageCapMode: parsed.usageCapMode,
        validFrom: parsed.validFrom,
        validTo: parsed.validTo,
        usageCount: 0,
        usageCap,
        usageCapLabel,
        storeScope: parsed.storeScope,
        remainingLabel: usageCap === null ? '—' : `${usageCap}`,
        storeScopeLabel,
        issuedByLabel,
        status: 'active',
      });

      if (created !== false) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, scrollToFirstError);

  const storeScopeOptions = canChooseGlobalScope
    ? [
        { value: 'all' as const, label: 'タイプA: 全店舗で使用可能（本部のみ設定可）' },
        { value: 'branch' as const, label: 'タイプB: 発行店舗のみで使用可能' },
      ]
    : [{ value: 'branch' as const, label: 'タイプB: 発行店舗のみで使用可能' }];

  const handleAutoGenerate = () => {
    const nextCode = generateUniquePromoCode(campaignCode, existingCodes);

    form.setValue('codeMode', 'auto', { shouldDirty: true, shouldValidate: true });
    form.setValue('code', nextCode, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>プロモーションコードを発行</DialogTitle>
          <p className="text-muted-foreground text-sm">
            G-06 FR-001 コード発行に準拠。命名規則（G-03 FR-007）: 店舗ID＋英数字5桁 / OGF会員向け:
            OGF＋英数字5桁。登録時にユニーク性を自動判定します。
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4 py-1" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="campaignId"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel className="text-muted-foreground text-xs">
                    紐づけキャンペーン（G-06 FR-003）
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger id="promo-campaign" className="w-full">
                        <SelectValue placeholder="キャンペーンを選択">{campaignName}</SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaignOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
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
              name="code"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel className="text-muted-foreground text-xs">
                      コード（G-06 FR-002 形式選択）
                    </FormLabel>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <FormControl>
                      <Input
                        id="promo-code"
                        className="font-mono"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          form.setValue('codeMode', 'manual', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          field.onChange(event.target.value.toUpperCase());
                        }}
                        placeholder="例: STR01-ABCDE（手動入力 or 自動生成）"
                      />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={handleAutoGenerate}>
                      自動生成
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-[10px]">
                    手動入力時は保存前に全コードと重複チェックを行います
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <Label htmlFor="promo-description" className="text-muted-foreground text-xs">
                    説明（任意）
                  </Label>
                  <FormControl>
                    <Input
                      id="promo-description"
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      placeholder="例: 春の入会キャンペーン用"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs">有効期間（G-06 FR-004）</Label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field, fieldState }) => {
                    const date = field.value ? new Date(`${field.value}T00:00:00`) : undefined;
                    return (
                      <FormItem className="grid gap-2">
                        <DatePicker
                          date={date}
                          placeholder="日付を選択"
                          onDateChange={(nextDate) => {
                            field.onChange(nextDate ? format(nextDate, 'yyyy-MM-dd') : '');
                          }}
                          disabledDate={
                            validToDate ? (dateValue) => dateValue > validToDate : undefined
                          }
                          hasError={Boolean(fieldState.error)}
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <span className="text-muted-foreground flex items-center justify-center text-xs">
                  〜
                </span>
                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field, fieldState }) => {
                    const date = field.value ? new Date(`${field.value}T00:00:00`) : undefined;
                    return (
                      <FormItem className="grid gap-2">
                        <DatePicker
                          date={date}
                          placeholder="日付を選択"
                          onDateChange={(nextDate) => {
                            field.onChange(nextDate ? format(nextDate, 'yyyy-MM-dd') : '');
                          }}
                          disabledDate={
                            validFromDate ? (dateValue) => dateValue < validFromDate : undefined
                          }
                          hasError={Boolean(fieldState.error)}
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="usageCapMode"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel htmlFor="usage-cap-mode" className="text-muted-foreground text-xs">
                      有効数（G-06 FR-005）
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'unlimited') {
                          form.setValue('usageCap', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <SelectTrigger id="usage-cap-mode" className="w-[160px]">
                        <SelectValue>{PROMO_CODE_USAGE_CAP_MODE_LABELS[field.value]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlimited">無制限</SelectItem>
                        <SelectItem value="limited">回数指定</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {usageCapMode === 'limited' ? (
              <FormField
                control={form.control}
                name="usageCap"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        placeholder="例: 100（空欄で無制限）"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <p className="text-muted-foreground text-xs">無制限を選択した場合は入力不要です。</p>
            )}

            <FormField
              control={form.control}
              name="storeScope"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="store-scope" className="text-muted-foreground text-xs">
                    適用店舗タイプ（G-06 FR-006）
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    disabled={!canChooseGlobalScope}
                  >
                    <SelectTrigger
                      id="store-scope"
                      className={cn('w-full', !canChooseGlobalScope && 'opacity-100')}
                    >
                      <SelectValue>{PROMO_CODE_STORE_SCOPE_LABELS[field.value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {storeScopeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {canChooseGlobalScope ? (
                    <p className="text-muted-foreground text-xs">はタイプA と B を選択できます。</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">Staff はタイプB 固定です。</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
                発行する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
