'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { SearchableSelect } from '@/components/common/searchable-select';

import { getCrmStoresByIdOptions, getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

const STORE_SEARCH_LIMIT = 20;

type LockerPendingStoreSelectProps = {
  value: string | null;
  onChange: (storeId: string | null) => void;
  isActive: boolean;
};

/**
 * FR-008 店舗フィルター（開放待ち一覧の店舗横断抽出用）。
 *
 * 店舗マスタは件数が多くなり得るため、固定 limit で全件を読み込んでクライアント側で
 * 絞り込むのではなく、`SearchableSelect` のサーバー検索で候補を引く（候補の切り捨て防止）。
 */
export function LockerPendingStoreSelect({
  value,
  onChange,
  isActive,
}: LockerPendingStoreSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: storesRes, isFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: STORE_SEARCH_LIMIT,
        search: searchQuery || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isOpen,
  });

  const stores = storesRes?.stores ?? [];
  const selectedFromOptions = value ? stores.find((store) => store.id === value) : undefined;

  const { data: selectedStoreRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: value ?? '' } }),
    enabled: Boolean(value) && !selectedFromOptions,
  });

  const selectedLabel = value
    ? (selectedFromOptions?.name ?? selectedStoreRes?.store?.name ?? value)
    : undefined;

  return (
    <SearchableSelect<Store>
      value={value}
      valueLabel={selectedLabel}
      options={stores}
      placeholder="全店舗"
      searchPlaceholder="店舗名・店舗コードで検索..."
      emptyMessage="該当する店舗がありません"
      loadingMessage="店舗を読み込み中..."
      isLoading={isFetching}
      open={isOpen}
      onOpenChange={setIsOpen}
      onSearchChange={setSearchQuery}
      onSelect={(store) => onChange(store?.id ?? null)}
      getOptionKey={(store) => store.id}
      getOptionLabel={(store) => store.name}
      getOptionKeywords={(store) =>
        [store.name, store.store_id, store.id, store.club_code].filter(Boolean).join(' ')
      }
      triggerClassName={`h-8 min-w-40 text-xs font-normal ${
        isActive ? 'border-primary bg-primary/10 text-foreground' : ''
      }`}
    />
  );
}
