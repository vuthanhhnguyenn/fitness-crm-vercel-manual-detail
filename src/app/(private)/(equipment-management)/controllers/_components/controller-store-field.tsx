'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { SearchableSelect } from '@/components/common/searchable-select';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

type ControllerStoreFieldProps = {
  value: string;
  onChange: (storeCode: string) => void;
  hasError?: boolean;
};

export function ControllerStoreField({ value, onChange, hasError }: ControllerStoreFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Remember the store picked from the list so the trigger can render its label
  // without refetching once the dropdown closes.
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // We only need to resolve the selected store via the API when we don't already
  // have it cached locally (e.g. an initial value coming from edit mode).
  const needsResolve = Boolean(value) && selectedStore?.store_id !== value;

  // When the dropdown is open, search by the user's query. When closed but the
  // current value still needs resolving, search by the value so the trigger can
  // show "店舗名 (コード)" without an option list being opened.
  const { data, isFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 20,
        search: (isOpen ? searchQuery : value) || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isOpen || needsResolve,
  });

  const stores = data?.stores ?? [];
  const selected =
    (value ? stores.find((store) => store.store_id === value) : undefined) ??
    (selectedStore?.store_id === value ? selectedStore : undefined);
  const valueLabel = value
    ? selected
      ? `${selected.name} (${selected.store_id})`
      : value
    : undefined;

  const handleSelect = (store: Store | null) => {
    setSelectedStore(store);
    onChange(store?.store_id ?? '');
  };

  return (
    <SearchableSelect<Store>
      value={value || null}
      valueLabel={valueLabel}
      options={stores}
      placeholder="店舗コードを選択"
      searchPlaceholder="店舗を検索..."
      emptyMessage="該当する店舗がありません"
      loadingMessage="店舗を読み込み中..."
      clearLabel="選択をクリア"
      open={isOpen}
      onOpenChange={setIsOpen}
      onSearchChange={setSearchQuery}
      onSelect={handleSelect}
      getOptionKey={(store) => store.store_id}
      getOptionLabel={(store) => `${store.name} (${store.store_id})`}
      getOptionKeywords={(store) =>
        [store.name, store.store_id, store.id, store.club_code].filter(Boolean).join(' ')
      }
      renderOption={(store) => (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TextWithTooltip text={store.name} wrapperClassName="min-w-0 flex-1" className="w-full" />
          <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
            {store.store_id}
          </span>
        </div>
      )}
      isLoading={isFetching}
      triggerClassName={`h-9 w-full justify-between ${hasError ? 'border-destructive' : ''}`}
    />
  );
}
