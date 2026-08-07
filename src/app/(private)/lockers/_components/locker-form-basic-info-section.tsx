'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { getCrmStoresByIdOptions, getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

import type { LockerFormValues } from '../_schemas/locker-form.schema';

const STORE_SEARCH_LIMIT = 20;
const STORE_CACHE_MS = 5 * 60 * 1000;

export function LockerFormBasicInfoSection() {
  const form = useFormContext<LockerFormValues>();
  const [isStorePopoverOpen, setIsStorePopoverOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const selectedStoreId = form.watch('store_id');

  const { data: storesRes, isFetching: isStoresFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: STORE_SEARCH_LIMIT,
        search: storeSearchQuery || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isStorePopoverOpen,
    staleTime: STORE_CACHE_MS,
  });

  const stores = storesRes?.stores ?? [];
  const selectedStoreFromOptions = selectedStoreId
    ? stores.find((store) => store.id === selectedStoreId)
    : undefined;

  const { data: selectedStoreRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: selectedStoreId } }),
    enabled: Boolean(selectedStoreId) && !selectedStoreFromOptions,
    staleTime: STORE_CACHE_MS,
  });

  const selectedStoreLabel = selectedStoreId
    ? (selectedStoreFromOptions?.name ?? selectedStoreRes?.store?.name)
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="store_id"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  設置店舗<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <SearchableSelect<Store>
                    value={field.value || null}
                    valueLabel={selectedStoreLabel}
                    options={stores}
                    placeholder="店舗を選択"
                    searchPlaceholder="店舗名・店舗IDで検索..."
                    emptyMessage="該当する店舗がありません"
                    loadingMessage="店舗を読み込み中..."
                    isLoading={isStoresFetching}
                    open={isStorePopoverOpen}
                    onOpenChange={setIsStorePopoverOpen}
                    onSearchChange={setStoreSearchQuery}
                    onSelect={(store) => field.onChange(store?.id ?? '')}
                    getOptionKey={(store) => store.id}
                    getOptionLabel={(store) => store.name}
                    getOptionKeywords={(store) =>
                      [store.name, store.store_id, store.id, store.club_code]
                        .filter(Boolean)
                        .join(' ')
                    }
                    triggerClassName="h-9 w-full"
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
