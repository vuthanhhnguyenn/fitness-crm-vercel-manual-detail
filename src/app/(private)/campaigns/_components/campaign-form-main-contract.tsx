'use client';

import { useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';

import { useInfiniteScroll } from '@/hooks/use-infinite-scroll.hook';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

import {
  getCrmMainContractsByIdOptions,
  getCrmMainContractsInfiniteOptions,
  getCrmOptionsByIdOptions,
  getCrmOptionsInfiniteOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMainContractsResponse, GetCrmOptionsResponse } from '@/lib/api/types.gen';

import { CAMPAIGN_SEARCH_PAGE_LIMIT } from '../_constants/constants';
import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignFieldLabel } from './campaign-required-label';

export function CampaignFormMainContract() {
  const form = useFormContext<CampaignFormValues>();
  const planId = useWatch({ control: form.control, name: 'planId' });
  const conditionOptionIds = useWatch({ control: form.control, name: 'conditionOptionIds' });
  const [planSearch, setPlanSearch] = useState('');
  const {
    data: plansData,
    isFetching: isPlansFetching,
    fetchNextPage: fetchNextPlans,
    hasNextPage: hasMorePlans,
    isFetchingNextPage: isFetchingMorePlans,
  } = useInfiniteQuery({
    ...getCrmMainContractsInfiniteOptions({
      query: { limit: CAMPAIGN_SEARCH_PAGE_LIMIT, search: planSearch || undefined },
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmMainContractsResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const {
    data: optionsData,
    fetchNextPage: fetchNextOptions,
    hasNextPage: hasMoreOptions,
    isFetchingNextPage: isFetchingMoreOptions,
  } = useInfiniteQuery({
    ...getCrmOptionsInfiniteOptions({ query: { limit: CAMPAIGN_SEARCH_PAGE_LIMIT } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmOptionsResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const plans = useMemo(
    () => plansData?.pages.flatMap((page) => page.main_contracts ?? []) ?? [],
    [plansData],
  );
  const options = useMemo(
    () => optionsData?.pages.flatMap((page) => page.options ?? []) ?? [],
    [optionsData],
  );

  // 初回取得範囲（CAMPAIGN_SEARCH_PAGE_LIMIT件）に選択済みの主契約が含まれない場合、
  // 個別取得して名前を解決する（一覧を絞り込んで再現: /campaigns/{id}/edit で発生）。
  const selectedPlanFromOptions = useMemo(
    () => plans.find((plan) => plan.id === planId),
    [plans, planId],
  );
  const { data: selectedPlanRes } = useQuery({
    ...getCrmMainContractsByIdOptions({ path: { id: planId || '' } }),
    enabled: !!planId && !selectedPlanFromOptions,
  });
  const selectedPlanLabel = selectedPlanFromOptions?.name ?? selectedPlanRes?.main_contract?.name;

  // 同様に、選択済みのオプションが初回取得範囲外だと一覧に表示されず選択状態を確認できないため、
  // 不足分を個別取得して一覧にマージする。
  const missingConditionOptionIds = useMemo(
    () => conditionOptionIds.filter((id) => !options.some((option) => option.id === id)),
    [conditionOptionIds, options],
  );
  const missingConditionOptionQueries = useQueries({
    queries: missingConditionOptionIds.map((id) => ({
      ...getCrmOptionsByIdOptions({ path: { id } }),
    })),
  });
  const conditionOptions = useMemo(() => {
    const missingOptions = missingConditionOptionQueries
      .map((query) => query.data?.option)
      .filter((option): option is NonNullable<typeof option> => !!option);
    return [...options, ...missingOptions];
  }, [options, missingConditionOptionQueries]);

  const conditionGridRef = useRef<HTMLDivElement | null>(null);
  const conditionSentinelRef = useInfiniteScroll({
    hasMore: hasMoreOptions ?? false,
    isLoading: isFetchingMoreOptions,
    onLoadMore: fetchNextOptions,
    rootRef: conditionGridRef,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">適用主契約・適用条件</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="planId"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel required>割引適用先の主契約（1件）</CampaignFieldLabel>
                <FormDescription>
                  割引を適用する主契約を1件選択してください。キャンペーンを選択すると、この主契約が自動的に決まります。
                </FormDescription>
                <FormControl>
                  <SearchableSelect
                    value={field.value || null}
                    valueLabel={selectedPlanLabel}
                    options={plans}
                    placeholder="主契約を選択"
                    searchPlaceholder="主契約名・IDで検索..."
                    emptyMessage="該当する主契約がありません"
                    loadingMessage="検索中..."
                    isLoading={isPlansFetching && !isFetchingMorePlans}
                    hasMore={hasMorePlans}
                    isLoadingMore={isFetchingMorePlans}
                    onLoadMore={fetchNextPlans}
                    loadingMoreMessage="読み込み中..."
                    onSearchChange={setPlanSearch}
                    onSelect={(plan) => field.onChange(plan?.id ?? '')}
                    getOptionKey={(plan) => plan.id}
                    getOptionLabel={(plan) => plan.name}
                    triggerClassName="h-9 w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="conditionOptionIds"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel>適用発動条件のオプション契約（複数選択可）</CampaignFieldLabel>
                <FormDescription>
                  このキャンペーンが発動する条件となるオプション契約を選択してください。例:
                  ヨガ＋ロッカー両方加入で適用
                </FormDescription>
                <div
                  ref={conditionGridRef}
                  className="grid max-h-56 grid-cols-3 gap-3 overflow-auto pt-1"
                >
                  {conditionOptions.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`condition-opt-${option.id}`}
                        checked={field.value.includes(option.id)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked
                              ? [...field.value, option.id]
                              : field.value.filter((id) => id !== option.id),
                          );
                        }}
                      />
                      <Label
                        htmlFor={`condition-opt-${option.id}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {option.name}
                      </Label>
                    </div>
                  ))}
                  {(hasMoreOptions || isFetchingMoreOptions) && (
                    <div
                      ref={conditionSentinelRef}
                      className="col-span-3 flex items-center justify-center py-2"
                    >
                      {isFetchingMoreOptions && <Spinner className="size-4" />}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
