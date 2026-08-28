'use client';

import { useState } from 'react';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight, Store as StoreIcon } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

interface EntryExitHeaderControlsProps {
  date: string;
  /** Page-local narrowing override — only meaningful while the header scope is "全店舗". */
  storeOverride: string;
  onDateChange: (date: string) => void;
  onStoreOverrideChange: (storeId: string) => void;
}

/**
 * FR-B01-09/10/11: date navigation + calendar picker + a page-local store narrowing filter.
 * The narrowing filter only appears when the header-level store scope (`StoreSelector`,
 * `src/components/layout/store-selector.tsx`) is "全店舗" and there are 2+ stores in the
 * catalog — it lets HQ/System/Manager users drill into one store for this page without
 * changing their global header scope. When the header is already scoped to one store,
 * that scope is used directly and this filter is hidden.
 */
export function EntryExitHeaderControls({
  date,
  storeOverride,
  onDateChange,
  onStoreOverrideChange,
}: Readonly<EntryExitHeaderControlsProps>) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDate = parseISO(date);
  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()));

  const { currentStoreId } = useCurrentStore();
  const isAllStoresScope = currentStoreId === ALL_STORES;

  // Cheap probe (2 rows) to decide whether the override control is worth showing at
  // all — avoids fetching the full store catalog just to check its size.
  const { data: probeData } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 2, sort_by: 'name', sort_order: 'asc' } }),
    enabled: isAllStoresScope,
  });
  const showStoreOverride = isAllStoresScope && (probeData?.pagination.total ?? 0) >= 2;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Remember the store picked from the list so the trigger can render its label
  // without refetching once the dropdown closes.
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const isOverridden = storeOverride !== ALL_STORES;
  const needsResolve = isOverridden && selectedStore?.id !== storeOverride;

  const { data, isFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 20,
        search: (isOpen ? searchQuery : isOverridden ? storeOverride : undefined) || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: showStoreOverride && (isOpen || needsResolve),
  });

  const stores = data?.stores ?? [];
  const selected =
    (isOverridden ? stores.find((store) => store.id === storeOverride) : undefined) ??
    (selectedStore?.id === storeOverride ? selectedStore : undefined);
  const valueLabel = isOverridden ? (selected?.name ?? storeOverride) : '全店舗';

  const handleSelect = (store: Store | null) => {
    setSelectedStore(store);
    onStoreOverrideChange(store?.id ?? ALL_STORES);
  };

  const shiftDate = (deltaDays: number) => {
    onDateChange(format(addDays(selectedDate, deltaDays), 'yyyy-MM-dd'));
  };

  return (
    <div className="flex items-center gap-3">
      {showStoreOverride && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1.5">
            <StoreIcon className="text-muted-foreground size-4 shrink-0" />
            <SearchableSelect<Store>
              value={isOverridden ? storeOverride : null}
              valueLabel={valueLabel}
              options={stores}
              placeholder="全店舗"
              searchPlaceholder="店舗を検索..."
              emptyMessage="該当する店舗がありません"
              loadingMessage="店舗を読み込み中..."
              clearLabel="全店舗"
              open={isOpen}
              onOpenChange={setIsOpen}
              onSearchChange={setSearchQuery}
              onSelect={handleSelect}
              getOptionKey={(store) => store.id}
              getOptionLabel={(store) => store.name}
              getOptionKeywords={(store) => [store.name, store.club_code].filter(Boolean).join(' ')}
              isLoading={isFetching}
              triggerClassName="hover:bg-accent h-8 w-auto min-w-[100px] gap-2 border-0 bg-transparent px-2 text-sm font-medium"
              contentClassName="w-72"
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => shiftDate(-1)}
          aria-label="前日"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border px-3 text-sm ${
              isPastDate
                ? 'border-warning bg-warning/10 text-warning hover:bg-warning/15 hover:text-warning'
                : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <CalendarIcon className="size-3 shrink-0" />
            {format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  onDateChange(format(d, 'yyyy-MM-dd'));
                  setCalendarOpen(false);
                }
              }}
              locale={ja}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => shiftDate(1)}
          aria-label="翌日"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
