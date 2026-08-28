'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { type Control, useWatch } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';
import { formatYen } from '@/utils/format.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import type {
  DirectEnrollmentFormValues,
  EnrollmentFeeMaster,
} from '../_schemas/enrollment-form.schema';

interface FeeSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly feeMasters: EnrollmentFeeMaster[];
}

const REGISTRATION_FEE = 3300; // JOYFIT: 税別3,000円
const CARD_ISSUANCE_FEE = 5500; // FIT365: 税別5,000円

/** Mirrors `PLAN_MONTHLY_FEE_BY_ID` in `membership-application.table.ts`. */
const PLAN_MONTHLY_FEES: Record<string, number> = {
  'PLN-001': 7700,
  'PLN-002': 6600,
  'PLN-003': 5500,
  'PLN-004': 4400,
  'PLN-005': 5500,
  'PLN-006': 6600,
};

/** Mirrors `CAMPAIGN_NAME_BY_ID` in `membership-application.table.ts` — discount amounts only. */
const CAMPAIGN_DISCOUNTS: Record<string, number> = {
  'CMP-001': 2200,
  'CMP-002': 1100,
  'CMP-004': 2000,
  'CMP-005': 1100,
  'CMP-006': 3300,
};

/** 利用開始日から月末までの日割り会費（FR-054）。usageStartDate は YYYY-MM-DD。 */
function calcProratedFee(monthlyFee: number, usageStartDate: string): number | null {
  if (!usageStartDate) return null;
  const [y, m, d] = usageStartDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const daysInMonth = new Date(y, m, 0).getDate();
  const remainingDays = daysInMonth - d + 1;
  return Math.round((monthlyFee * remainingDays) / daysInMonth);
}

export function FeeSection({ control, feeMasters }: FeeSectionProps) {
  const brand = useWatch({ control, name: 'contract.brand_id' });
  const planId = useWatch({ control, name: 'contract.plan_id' });
  const usageStartDate = useWatch({ control, name: 'contract.usage_start_date' });
  const campaignId = useWatch({ control, name: 'contract.campaign_id' });
  const enrollmentFeeMasterId = useWatch({ control, name: 'contract.enrollment_fee_master_id' });

  const monthlyFee = planId ? (PLAN_MONTHLY_FEES[planId] ?? null) : null;
  const proratedFee = monthlyFee !== null ? calcProratedFee(monthlyFee, usageStartDate) : null;
  const selectedMaster = feeMasters.find((m) => m.id === enrollmentFeeMasterId);
  const campaignDiscount = campaignId ? (CAMPAIGN_DISCOUNTS[campaignId] ?? 0) : 0;

  if (!brand) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>入会金・先払い費用</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            ブランドを選択すると費用項目が切り替わります
          </p>
        </CardContent>
      </Card>
    );
  }

  const subtotal =
    (brand === 'FIT365' ? CARD_ISSUANCE_FEE : 0) +
    (brand !== 'FIT365' ? REGISTRATION_FEE : 0) +
    (brand !== 'FIT365' ? (selectedMaster?.amount ?? 0) : 0) +
    (proratedFee ?? 0) +
    (monthlyFee ?? 0);
  const total = Math.max(subtotal - campaignDiscount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>入会金・先払い費用</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {brand === 'FIT365' ? (
          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>カード発行料</FormLabel>
              <FormControl>
                <Input readOnly value={formatYen(CARD_ISSUANCE_FEE)} />
              </FormControl>
              <p className="text-muted-foreground text-xs">FIT365: 税別5,000円</p>
            </FormItem>
            <FormItem>
              <FormLabel>初月会費（日割）</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={proratedFee !== null ? formatYen(proratedFee) : ''}
                  placeholder="プランと利用開始日を選択"
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                利用開始日から月末までの日割りで自動計算
              </p>
            </FormItem>
            <FormItem>
              <FormLabel>翌月会費</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={monthlyFee !== null ? formatYen(monthlyFee) : ''}
                  placeholder="プランを選択"
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">プランの月額から自動適用</p>
            </FormItem>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="contract.enrollment_fee_master_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    入会金（マスタ参照）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                    items={toSelectItems(
                      feeMasters.map((m) => ({
                        value: m.id,
                        label: `${m.name}（${formatYen(m.amount)}）`,
                      })),
                    )}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={!brand ? 'ブランドを選択してください' : '入会金を選択'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feeMasters.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}（{formatYen(m.amount)}）
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    システム設定 › 入会金マスタ から選択
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>金額（マスタから自動適用）</FormLabel>
              <FormControl>
                <Input readOnly value={selectedMaster ? formatYen(selectedMaster.amount) : ''} />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>登録事務手数料</FormLabel>
              <FormControl>
                <Input readOnly value={formatYen(REGISTRATION_FEE)} />
              </FormControl>
              <p className="text-muted-foreground text-xs">JOYFIT: 税別3,000円</p>
            </FormItem>
            <FormItem>
              <FormLabel>初月会費（日割）</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={proratedFee !== null ? formatYen(proratedFee) : ''}
                  placeholder="プランと利用開始日を選択"
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                利用開始日から月末までの日割りで自動計算
              </p>
            </FormItem>
            <FormItem>
              <FormLabel>翌月会費</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value={monthlyFee !== null ? formatYen(monthlyFee) : ''}
                  placeholder="プランを選択"
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">プランの月額から自動適用</p>
            </FormItem>
          </div>
        )}
        <Separator />
        <div className="flex flex-col items-end gap-1">
          {campaignDiscount > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">
                キャンペーン割引（{feeCampaignLabel(campaignId)}）
              </span>
              <span className="text-sm font-medium">-{formatYen(campaignDiscount)}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">合計</span>
            <span className="text-lg font-semibold">{formatYen(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function feeCampaignLabel(campaignId: string | null | undefined): string {
  switch (campaignId) {
    case 'CMP-001':
      return '春の入会キャンペーン';
    case 'CMP-002':
      return '学生割引キャンペーン';
    case 'CMP-004':
      return '新生活応援';
    case 'CMP-005':
      return 'シニア割引キャンペーン';
    case 'CMP-006':
      return '法人会員キャンペーン';
    default:
      return '';
  }
}
