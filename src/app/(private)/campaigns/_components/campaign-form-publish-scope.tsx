'use client';

import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useInfiniteQuery, useQueries } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import {
  getCrmStoresByIdOptions,
  getCrmStoresInfiniteOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStoresResponse } from '@/lib/api/types.gen';

import { CAMPAIGN_PUBLISH_SCOPE_LABELS, CAMPAIGN_SEARCH_PAGE_LIMIT } from '../_constants/constants';
import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignFieldLabel } from './campaign-required-label';
import { CampaignStoreMultiSelect } from './campaign-store-multi-select';

export function CampaignFormPublishScope() {
  const form = useFormContext<CampaignFormValues>();
  const publishStoreIds = useWatch({ control: form.control, name: 'publishStoreIds' });

  const [storeSearch, setStoreSearch] = useState('');
  const {
    data: storesData,
    isFetching: isStoresFetching,
    fetchNextPage: fetchNextStores,
    hasNextPage: hasMoreStores,
    isFetchingNextPage: isFetchingMoreStores,
  } = useInfiniteQuery({
    ...getCrmStoresInfiniteOptions({
      query: { limit: CAMPAIGN_SEARCH_PAGE_LIMIT, search: storeSearch || undefined },
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmStoresResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const stores = useMemo(
    () => storesData?.pages.flatMap((page) => page.stores ?? []) ?? [],
    [storesData],
  );

  /** 検索結果ページに無い選択済み店舗の名前は、id ごとに個別取得して解決する。 */
  const missingStoreIds = publishStoreIds.filter((id) => !stores.some((store) => store.id === id));
  const missingStoreQueries = useQueries({
    queries: missingStoreIds.map((id) => getCrmStoresByIdOptions({ path: { id } })),
  });
  const resolveStoreName = (id: string) => {
    const index = missingStoreIds.indexOf(id);
    if (index === -1) return undefined;
    return missingStoreQueries[index]?.data?.store?.name;
  };

  const publishScope = form.watch('publishScope');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">公開店舗設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="publishScope"
            render={({ field }) => (
              <FormItem>
                <CampaignFieldLabel required>公開範囲</CampaignFieldLabel>
                <FormDescription>
                  このキャンペーンを公開する店舗の範囲を選択してください。新店オープン記念等の店舗独自キャンペーンには「特定店舗のみ公開」を選択してください。
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === 'all_stores') {
                        form.setValue('publishStoreIds', [], { shouldDirty: true });
                      }
                    }}
                    className="flex flex-col gap-3"
                  >
                    {Object.entries(CAMPAIGN_PUBLISH_SCOPE_LABELS).map(([value, label]) => (
                      <div key={value} className="flex items-center gap-2">
                        <RadioGroupItem value={value} id={`publish-${value}`} />
                        <Label
                          htmlFor={`publish-${value}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {publishScope === 'specific_stores' && (
            <FormField
              control={form.control}
              name="publishStoreIds"
              render={({ field }) => (
                <FormItem>
                  <CampaignFieldLabel required>公開対象店舗</CampaignFieldLabel>
                  <FormDescription>公開する店舗を選択してください（複数選択可）。</FormDescription>
                  <FormControl>
                    <CampaignStoreMultiSelect
                      stores={stores}
                      value={field.value}
                      onChange={field.onChange}
                      onSearchChange={setStoreSearch}
                      isLoading={isStoresFetching && !isFetchingMoreStores}
                      hasMore={hasMoreStores}
                      isLoadingMore={isFetchingMoreStores}
                      onLoadMore={fetchNextStores}
                      resolveStoreName={resolveStoreName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
