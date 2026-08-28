'use client';

import { useMemo, useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { useInfiniteQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { getCrmOptionsInfiniteOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmOptionsResponse } from '@/lib/api/types.gen';

import { CAMPAIGN_SEARCH_PAGE_LIMIT } from '../_constants/constants';
import { type CampaignFormValues, EMPTY_DISCOUNT_ROW } from '../_schemas/campaign-form.schema';

type MonthKey = 'first' | 'second';

/** 割引行の対象種別。SelectTrigger のラベル表示にも使う。 */
const DISCOUNT_TARGET_LABELS: Record<string, string> = {
  plan: '主契約',
  option: 'オプション',
};

const MONTH_CONFIG: Record<
  MonthKey,
  {
    title: string;
    description: string;
    switchName: 'discountFirstMonthEnabled' | 'discountSecondMonthEnabled';
    rowsName: 'discountRowsFirst' | 'discountRowsSecond';
  }
> = {
  first: {
    title: '初月',
    description: '利用開始月に割引を適用',
    switchName: 'discountFirstMonthEnabled',
    rowsName: 'discountRowsFirst',
  },
  second: {
    title: '翌月',
    description: '利用開始月の翌月に割引を適用',
    switchName: 'discountSecondMonthEnabled',
    rowsName: 'discountRowsSecond',
  },
};

function DiscountMonthBlock({ month }: Readonly<{ month: MonthKey }>) {
  const config = MONTH_CONFIG[month];
  const form = useFormContext<CampaignFormValues>();
  const [optionSearch, setOptionSearch] = useState('');
  const {
    data: optionsData,
    isFetching: isOptionsFetching,
    fetchNextPage: fetchNextOptions,
    hasNextPage: hasMoreOptions,
    isFetchingNextPage: isFetchingMoreOptions,
  } = useInfiniteQuery({
    ...getCrmOptionsInfiniteOptions({
      query: { limit: CAMPAIGN_SEARCH_PAGE_LIMIT, search: optionSearch || undefined },
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmOptionsResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const options = useMemo(
    () => optionsData?.pages.flatMap((page) => page.options ?? []) ?? [],
    [optionsData],
  );
  const enabled = useWatch({ control: form.control, name: config.switchName });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: config.rowsName,
  });
  const rows = useWatch({ control: form.control, name: config.rowsName });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`discount-${month}-month`} className="text-sm font-semibold">
            {config.title}
          </Label>
          <p className="text-muted-foreground text-xs">{config.description}</p>
        </div>
        <FormField
          control={form.control}
          name={config.switchName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Switch
                  id={`discount-${month}-month`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {enabled && (
        <div className="border-muted flex flex-col gap-3 border-l-2 pl-4">
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className="grid grid-cols-[140px_1fr_1fr_1fr_auto] items-end gap-2"
            >
              <FormField
                control={form.control}
                name={`${config.rowsName}.${index}.target`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <Label className="text-sm">対象</Label>}
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          {/* base-ui の Select.Value は既定で「値」を描画するためラベルを明示する。 */}
                          <SelectValue placeholder="対象を選択">
                            {DISCOUNT_TARGET_LABELS[field.value] ?? undefined}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DISCOUNT_TARGET_LABELS).map(([value, label]) => (
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
                name={`${config.rowsName}.${index}.optionId`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <Label className="text-sm">オプション</Label>}
                    <FormControl>
                      <SearchableSelect
                        value={field.value || null}
                        options={options}
                        placeholder="—"
                        searchPlaceholder="オプション名で検索..."
                        emptyMessage="該当するオプションがありません"
                        loadingMessage="読み込み中..."
                        isLoading={isOptionsFetching && !isFetchingMoreOptions}
                        hasMore={hasMoreOptions}
                        isLoadingMore={isFetchingMoreOptions}
                        onLoadMore={fetchNextOptions}
                        loadingMoreMessage="読み込み中..."
                        onSearchChange={setOptionSearch}
                        onSelect={(option) => field.onChange(option?.id ?? '')}
                        getOptionKey={(option) => option.id}
                        getOptionLabel={(option) => option.name}
                        disabled={rows?.[index]?.target !== 'option'}
                        triggerClassName="h-9 w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`${config.rowsName}.${index}.amount`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <Label className="text-sm">割引額（円）</Label>}
                    <div className="flex items-center gap-1">
                      <FormControl>
                        <Input type="number" min={0} placeholder="例: 3000" {...field} />
                      </FormControl>
                      <span className="text-muted-foreground shrink-0 text-sm">円</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`${config.rowsName}.${index}.rate`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <Label className="text-sm">割引率（%）</Label>}
                    <div className="flex items-center gap-1">
                      <FormControl>
                        <Input type="number" min={0} max={100} placeholder="例: 50" {...field} />
                      </FormControl>
                      <span className="text-muted-foreground shrink-0 text-sm">%</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={index === 0 ? 'pt-6' : ''}>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive size-8 p-0"
                    onClick={() => remove(index)}
                    aria-label="割引対象を削除"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit text-xs"
            onClick={() => append({ ...EMPTY_DISCOUNT_ROW, target: 'option' })}
          >
            + 対象を追加
          </Button>
        </div>
      )}
    </div>
  );
}

export function CampaignFormDiscountSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">割引設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <p className="text-muted-foreground text-xs">
            主契約・オプションごとに割引額（円）または割引率（%）を設定します。割引は初月・翌月のみ設定できます（#159）。
          </p>

          <DiscountMonthBlock month="first" />
          <Separator />
          <DiscountMonthBlock month="second" />
        </div>
      </CardContent>
    </Card>
  );
}
