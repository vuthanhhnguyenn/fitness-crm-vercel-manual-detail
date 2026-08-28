'use client';

import { useState } from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';

import { SearchableSelect } from '@/components/common/searchable-select';

import { getCrmOptionsInfiniteOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmOptionsResponse } from '@/lib/api/types.gen';

export type LockerOptionMasterItem = NonNullable<GetCrmOptionsResponse>['options'][number];

const PAGE_SIZE = 20;

type LockerOptionMasterSelectProps = {
  /** Currently selected option master **code** (e.g. `LK-STD-001`), not its id. */
  value: string | null;
  /**
   * Label for the selected code. Required whenever the selection may sit outside the first
   * page — the selected master is otherwise unknown until the user scrolls to it.
   */
  valueLabel?: string;
  onSelect: (item: LockerOptionMasterItem | null) => void;
  /** Extra rule filter applied to each fetched page (e.g. FR-013 bottom-row-only types). */
  filterOption?: (item: LockerOptionMasterItem) => boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  hasError?: boolean;
  triggerClassName?: string;
};

/**
 * Select over the G-02 locker option master.
 *
 * The master is paged 20 rows at a time with server-side search instead of being loaded in
 * one shot, so the list can never be silently truncated as codes are added per shape and
 * brand. Screens that only need to *label* an already-assigned code read it from the locker
 * detail response (`slot.contract_type`) rather than from this list.
 */
export function LockerOptionMasterSelect({
  value,
  valueLabel,
  onSelect,
  filterOption,
  placeholder = '選択してください',
  searchPlaceholder = '契約種類名・コードで検索',
  emptyMessage = '該当する契約種類がありません',
  disabled = false,
  hasError = false,
  triggerClassName,
}: LockerOptionMasterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    ...getCrmOptionsInfiniteOptions({
      query: {
        limit: PAGE_SIZE,
        status: 'active',
        category: 'locker_option',
        search: searchQuery || undefined,
        sort_by: 'code',
        sort_order: 'asc',
      },
    }),
    enabled: isOpen,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmOptionsResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const loaded = data?.pages.flatMap((page) => page.options ?? []) ?? [];
  const options = filterOption ? loaded.filter(filterOption) : loaded;

  return (
    <SearchableSelect<LockerOptionMasterItem>
      value={value || null}
      valueLabel={valueLabel}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      loadingMessage="契約種類を読み込み中..."
      isLoading={isFetching && !isFetchingNextPage}
      disabled={disabled}
      hasError={hasError}
      open={isOpen}
      onOpenChange={setIsOpen}
      onSearchChange={setSearchQuery}
      onSelect={onSelect}
      getOptionKey={(item) => item.code}
      getOptionLabel={(item) => `${item.name}（¥${item.price_including_tax.toLocaleString()}/月）`}
      getOptionKeywords={(item) => [item.name, item.code].join(' ')}
      hasMore={hasNextPage}
      isLoadingMore={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      triggerClassName={triggerClassName}
    />
  );
}
