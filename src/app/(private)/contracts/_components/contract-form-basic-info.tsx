'use client';

import { useFormContext } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { getCrmMainContractsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { MainContractOtherStoreUsage, MainContractType, StoreListBrand } from '@/lib/api/types.gen';

import {
  MAIN_CONTRACT_BRAND_LABELS,
  MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS,
  MAIN_CONTRACT_TYPE_LABELS,
} from '../_constants/constants';
import type { ContractFormValues } from '../_schemas/contract-form.schema';

export function ContractFormBasicInfo() {
  const form = useFormContext<ContractFormValues>();

  const { data: mainContractsData } = useQuery({
    ...getCrmMainContractsOptions({ query: { limit: 200 } }),
  });
  const parentContractOptions = mainContractsData?.main_contracts ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 px-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  主契約名<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="例: レギュラー会員" {...field} />
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
                  コード<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="例: REG-001" className="font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contract_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  契約タイプ<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  key={`contract_type-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="契約タイプを選択">
                        {MAIN_CONTRACT_TYPE_LABELS[field.value]}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MainContractType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {MAIN_CONTRACT_TYPE_LABELS[type]}
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
            name="other_store_usage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>他店舗利用可否</FormLabel>
                <Select
                  key={`other_store_usage-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください">
                        {field.value
                          ? MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS[field.value]
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MainContractOtherStoreUsage).map((usage) => (
                      <SelectItem key={usage} value={usage}>
                        {MAIN_CONTRACT_OTHER_STORE_USAGE_LABELS[usage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ブランド・属性</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 px-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ブランド<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  key={`brand-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="ブランドを選択">
                        {field.value ? MAIN_CONTRACT_BRAND_LABELS[field.value] : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(StoreListBrand).map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {MAIN_CONTRACT_BRAND_LABELS[brand]}
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
            name="parent_contract_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>親主契約名</FormLabel>
                <Select
                  key={`parent-${field.value ?? 'empty'}`}
                  value={field.value ?? undefined}
                  onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="なし（親主契約なし）">
                        {field.value
                          ? parentContractOptions.find((c) => c.id === field.value)?.name
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {parentContractOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  派生マスタを作成する場合に親主契約を指定します
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="old_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>旧コード</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: OLD-REG-001"
                    className="font-mono"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <p className="text-muted-foreground mt-1 text-xs">
                  参考情報として旧システムのコードを記録できます
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mutual_use"
            render={({ field }) => (
              <FormItem>
                <FormLabel>相互利用あり</FormLabel>
                <div className="flex items-center gap-2 pt-1">
                  <Switch id="mutual-use" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="mutual-use" className="text-muted-foreground text-sm font-normal">
                    有効にする
                  </Label>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  JOYFIT: 主契約扱い / FIT365: オプション扱い
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companion_benefit_enabled"
            render={({ field }) => (
              <FormItem>
                <FormLabel>同伴特典</FormLabel>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    id="companion-benefit"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label
                    htmlFor="companion-benefit"
                    className="text-muted-foreground text-sm font-normal"
                  >
                    付与する
                  </Label>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  オンにすると当該プランの会員に同伴招待権限（1日1回・1名）が付与されます
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="public_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>会員公開用主契約名</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: レギュラー会員（学生割引）"
                    {...field}
                    value={field.value ?? ''}
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
          <CardTitle className="text-base">説明</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="契約の説明を入力してください"
                    rows={4}
                    {...field}
                    value={field.value ?? ''}
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
          <CardTitle className="text-base">会員公開設定</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 px-4">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>企業</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 株式会社ジョイフィット"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="regulation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>規約</FormLabel>
                <FormControl>
                  <Input placeholder="例: 会員規約 第1版" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="public_description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>説明文</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="会員向けに公開する主契約の詳細説明を入力してください"
                    rows={3}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="memo"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>備考</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="備考を入力してください"
                    rows={3}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
