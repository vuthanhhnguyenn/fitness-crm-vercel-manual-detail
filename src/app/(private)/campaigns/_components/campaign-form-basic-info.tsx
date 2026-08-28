'use client';

import { useFormContext } from 'react-hook-form';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { BrandEnum } from '@/lib/api/types.gen';

import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignFieldLabel } from './campaign-required-label';

export function CampaignFormBasicInfo() {
  const form = useFormContext<CampaignFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel required>キャンペーン名</CampaignFieldLabel>
                <FormControl>
                  <Input placeholder="例: 春の入会キャンペーン" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* G-03 FR-007: 命名規則は案内のみ。検証はユニーク性のみ (API側で判定) */}
          <FormField
            control={form.control}
            name="campaignCode"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel optional>キャンペーンコード</CampaignFieldLabel>
                <FormDescription>
                  命名規則: 「店舗ID＋英数字5桁」（例: STR01-A1B2C）/ OGF会員向け:
                  「OGF＋英数字5桁」（例: OGF-X9Y8Z）
                </FormDescription>
                <FormControl>
                  <Input placeholder="例: STR01-A1B2C" {...field} />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  登録時にユニーク性を自動チェックします
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brandEnum"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel required>ブランド</CampaignFieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      {/* base-ui の Select.Value は既定で「値」を描画するためラベルを明示する。 */}
                      <SelectValue placeholder="ブランドを選択">
                        {field.value ? BRAND_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(BrandEnum).map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {BRAND_LABELS[brand]}
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
            name="entryCap"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel optional>先着件数上限</CampaignFieldLabel>
                <FormDescription>
                  設定した件数に到達すると、システムが自動で受付可否フラグをOFFにします。一覧では「上限到達」ステータスとして表示されます。
                </FormDescription>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="例: 100"
                      className="w-28"
                      {...field}
                    />
                  </FormControl>
                  <span className="text-muted-foreground text-sm">件</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lockInMonths"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel optional>縛り期間（解約手数料期間）</CampaignFieldLabel>
                <FormDescription>
                  JOYFIT自動移籍の対象外となる期間を設定します。期間中は自動移籍の例外対象になります。
                </FormDescription>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input type="number" min={0} placeholder="例: 6" className="w-28" {...field} />
                  </FormControl>
                  <span className="text-muted-foreground text-sm">ヶ月</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel>備考</CampaignFieldLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="キャンペーンの目的や概要を入力してください"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
