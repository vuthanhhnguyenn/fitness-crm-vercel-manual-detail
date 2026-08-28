'use client';

import { useState } from 'react';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { useQuery } from '@tanstack/react-query';
import { Building2, Check, ChevronDown } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce.hook';

import { BrandBadge } from '@/components/common/brand-badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store } from '@/lib/api/types.gen';

const STORE_SEARCH_LIMIT = 20;

/** Header-level store scope selector — drives which store(s) every page's data queries are scoped to. */
export function StoreSelector() {
  const { currentStoreId, setCurrentStoreId, restrictedStores, canSelectAllStores, isLoading } =
    useCurrentStore();
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  // Remember the store picked from the list so the trigger can render its label
  // without refetching once the dropdown closes.
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const isAllStores = currentStoreId === ALL_STORES;

  // Roles that can browse the full catalog don't have it preloaded (see
  // CurrentStoreProvider) — resolve the current selection on demand, either from an
  // open search or (when closed) by searching for the id itself.
  const needsResolve = canSelectAllStores && !isAllStores && selectedStore?.id !== currentStoreId;

  const { data, isFetching } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: STORE_SEARCH_LIMIT,
        search: (open ? debouncedSearch : currentStoreId) || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: canSelectAllStores && (open || needsResolve),
  });

  const stores = canSelectAllStores ? (data?.stores ?? []) : restrictedStores;
  const currentStore =
    stores.find((store) => store.id === currentStoreId) ??
    (selectedStore?.id === currentStoreId ? selectedStore : undefined);

  const storeDisplayName = isAllStores
    ? '全店舗（本部）'
    : (currentStore?.name ?? (isLoading || isFetching ? '読み込み中...' : '店舗を選択'));

  // Single-store users (Staff/Trainer/Observer with exactly one accessible store) get a
  // non-interactive display — there's nothing to switch to.
  const showChevron = canSelectAllStores || restrictedStores.length > 1;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchInput('');
    }
  };

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setCurrentStoreId(store.id);
    handleOpenChange(false);
  };

  if (!showChevron) {
    return (
      <div className="border-sidebar-border/60 bg-sidebar-accent/40 flex max-w-[300px] min-w-[200px] shrink-0 items-center gap-2 rounded-lg border px-3 py-2">
        <div className="bg-sidebar-accent flex size-7 shrink-0 items-center justify-center rounded">
          <Building2 className="text-sidebar-foreground/70 size-4" />
        </div>
        <span className="text-sidebar-foreground/90 truncate text-sm font-medium">
          {storeDisplayName}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="border-sidebar-border/60 bg-sidebar-accent/40 hover:border-sidebar-border hover:bg-sidebar-accent flex h-auto max-w-[300px] min-w-[200px] shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors outline-none">
        <div className="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded">
          <Building2 className="text-sidebar-foreground/90 size-4" />
        </div>
        <span className="text-sidebar-foreground/90 flex-1 truncate text-left text-sm font-medium">
          {storeDisplayName}
        </span>
        <ChevronDown className="text-sidebar-foreground/70 size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-lg p-0 shadow-lg" sideOffset={8} align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={searchInput}
            onValueChange={setSearchInput}
            placeholder="店舗名・店舗コードで検索..."
          />
          <CommandList>
            <CommandEmpty>{isFetching ? '検索中...' : '該当する店舗がありません'}</CommandEmpty>

            {canSelectAllStores && (
              <CommandGroup heading="全体">
                <CommandItem
                  value="all"
                  onSelect={() => {
                    setCurrentStoreId(ALL_STORES);
                    handleOpenChange(false);
                  }}
                >
                  <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded">
                    <Building2 className="text-primary size-4" />
                  </div>
                  <div className="ml-2 min-w-0 flex-1">
                    <p className="text-sm font-medium">全店舗（本部）</p>
                    <p className="text-muted-foreground text-xs">全ブランド・全店舗横断</p>
                  </div>
                  {isAllStores && <Check className="text-primary size-4 shrink-0" />}
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="店舗">
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.id}
                  onSelect={() => handleSelectStore(store)}
                >
                  <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded">
                    <Building2 className="text-muted-foreground size-4" />
                  </div>
                  <div className="ml-2 min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{store.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {store.club_code && (
                        <span className="text-muted-foreground text-xs">{store.club_code}</span>
                      )}
                      <BrandBadge brand={store.brand} />
                    </div>
                  </div>
                  {currentStoreId === store.id && (
                    <Check className="text-primary size-4 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
