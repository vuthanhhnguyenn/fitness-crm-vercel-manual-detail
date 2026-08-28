'use client';

import { useEffect, useRef, useState } from 'react';

import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { useInfiniteScroll } from '@/hooks/use-infinite-scroll.hook';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';

import { cn } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 300;

type StoreOption = { id: string; name: string };

type CampaignStoreMultiSelectProps = {
  stores: readonly StoreOption[];
  value: string[];
  onChange: (next: string[]) => void;
  onSearchChange?: (search: string) => void;
  isLoading?: boolean;
  /** 現在ページの検索結果に無い（選択済みだが検索範囲外の）店舗名を解決する。 */
  resolveStoreName?: (id: string) => string | undefined;
  /** サーバー側にまだ読み込めるページが残っているか。 */
  hasMore?: boolean;
  /** 次ページを読み込み中か。 */
  isLoadingMore?: boolean;
  /** リスト末尾までスクロールした時に呼ばれる。 */
  onLoadMore?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

/** トリガー要約: 2件までは全件、3件以上は「A、B 他N件」。 */
function summarize(
  value: string[],
  stores: readonly StoreOption[],
  resolveStoreName?: (id: string) => string | undefined,
): string | null {
  if (value.length === 0) {
    return null;
  }

  const names = value.map(
    (id) => stores.find((store) => store.id === id)?.name ?? resolveStoreName?.(id) ?? id,
  );

  if (names.length <= 2) {
    return names.join('、');
  }

  return `${names[0]}、${names[1]} 他${names.length - 2}件`;
}

export function CampaignStoreMultiSelect({
  stores,
  value,
  onChange,
  onSearchChange,
  isLoading = false,
  resolveStoreName,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  placeholder = '店舗を選択してください',
  disabled = false,
}: Readonly<CampaignStoreMultiSelectProps>) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const summary = summarize(value, stores, resolveStoreName);
  const listRef = useRef<HTMLDivElement | null>(null);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: onLoadMore ?? (() => {}),
    rootRef: listRef,
    enabled: open && !!onLoadMore,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = setTimeout(() => {
      onSearchChange?.(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [onSearchChange, open, searchInput]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchInput('');
      onSearchChange?.('');
    }
  };

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((storeId) => storeId !== id) : [...value, id]);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-8 w-full justify-between font-normal"
          >
            {summary ? (
              <span className="truncate">{summary}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={searchInput}
            onValueChange={setSearchInput}
            placeholder="店舗名・クラブコードで検索..."
            className="h-8"
          />
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <span className="text-muted-foreground text-xs">選択中 {value.length}件</span>
            {value.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0 text-xs"
                onClick={() => onChange([])}
              >
                すべて解除
              </Button>
            )}
          </div>
          <CommandList ref={listRef}>
            {isLoading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                <Loader2 className="size-4 animate-spin" />
                検索中...
              </div>
            ) : (
              <>
                <CommandEmpty>該当なし</CommandEmpty>
                <CommandGroup>
                  {stores.map((store) => (
                    <CommandItem
                      key={store.id}
                      value={store.name}
                      onSelect={() => toggle(store.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          value.includes(store.id) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="flex-1">{store.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {(hasMore || isLoadingMore) && (
                  <div
                    ref={sentinelRef}
                    className="text-muted-foreground flex items-center justify-center gap-2 py-2 text-xs"
                  >
                    {isLoadingMore && (
                      <>
                        <Spinner className="size-3" />
                        読み込み中...
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
