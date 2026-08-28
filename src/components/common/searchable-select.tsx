'use client';

import { type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { ChevronsUpDown } from 'lucide-react';

import { useInfiniteScroll } from '@/hooks/use-infinite-scroll.hook';

import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';

import { cn } from '@/lib/utils';

const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

/** Props shared by the single and multi variants for server-side pagination. */
interface InfiniteScrollProps {
  /** Whether more pages can be loaded from the server. */
  hasMore?: boolean;
  /** Whether the next page is currently being fetched. */
  isLoadingMore?: boolean;
  /** Called when the user scrolls to the bottom of the list. */
  onLoadMore?: () => void;
  /** Optional label shown next to the spinner while fetching the next page. */
  loadingMoreMessage?: string;
}

/**
 * Sentinel row rendered at the bottom of the list. When it scrolls into view it
 * triggers `onLoadMore`; while fetching it shows an inline spinner.
 */
function SearchableSelectLoadMore({
  listRef,
  enabled,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadingMoreMessage,
}: InfiniteScrollProps & {
  listRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
}) {
  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: onLoadMore ?? (() => {}),
    rootRef: listRef,
    enabled: enabled && !!onLoadMore,
  });

  if (!hasMore && !isLoadingMore) {
    return null;
  }

  return (
    <div
      ref={sentinelRef}
      className="text-muted-foreground flex items-center justify-center gap-2 py-2 text-xs"
    >
      {isLoadingMore ? (
        <>
          <Spinner className="size-3" />
          {loadingMoreMessage ? <span>{loadingMoreMessage}</span> : null}
        </>
      ) : null}
    </div>
  );
}

interface SearchableSelectProps<TItem> extends InfiniteScrollProps {
  value: string | null;
  valueLabel?: string;
  options: readonly TItem[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  onSelect: (item: TItem | null) => void;
  getOptionKey: (item: TItem) => string;
  getOptionLabel: (item: TItem) => string;
  getOptionKeywords?: (item: TItem) => string;
  renderOption?: (item: TItem) => ReactNode;
  clearLabel?: string;
  loadingMessage?: string;
  hint?: ReactNode;
  isLoading?: boolean;
  debounceMs?: number;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSearchChange?: (value: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
  listClassName?: string;
  hasError?: boolean;
}

export function SearchableSelect<TItem>({
  value,
  valueLabel,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  onSelect,
  getOptionKey,
  getOptionLabel,
  getOptionKeywords,
  renderOption,
  clearLabel,
  loadingMessage,
  hint,
  isLoading = false,
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  disabled = false,
  open,
  onOpenChange,
  onSearchChange,
  triggerClassName,
  contentClassName,
  listClassName,
  hasError = false,
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadingMoreMessage,
}: SearchableSelectProps<TItem>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const isOpen = open ?? internalOpen;

  const selectedOption = useMemo(() => {
    if (!value) {
      return null;
    }

    return options.find((option) => getOptionKey(option) === value) ?? null;
  }, [getOptionKey, options, value]);

  const triggerLabel =
    valueLabel ?? (selectedOption ? getOptionLabel(selectedOption) : (value ?? placeholder));

  const resetSearch = () => {
    setSearchInput('');
    onSearchChange?.('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);

    if (!nextOpen) {
      resetSearch();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setTimeout(() => {
      onSearchChange?.(searchInput.trim());
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debounceMs, isOpen, onSearchChange, searchInput]);

  const handleSelect = (item: TItem | null) => {
    onSelect(item);
    handleOpenChange(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={isOpen}
            // aria-invalid lets useScrollToFirstError locate the field while it has an error
            aria-invalid={hasError || undefined}
            disabled={disabled}
            className={cn(
              'h-8 w-64 min-w-0 justify-between rounded-lg px-3 text-xs font-normal',
              triggerClassName,
              hasError && 'border-destructive focus-visible:ring-destructive/20',
            )}
          >
            <TextWithTooltip
              text={triggerLabel}
              wrapperClassName="min-w-0 flex-1"
              className="w-full text-left"
              side="bottom"
              align="start"
            />
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className={cn('w-(--anchor-width) p-0', contentClassName)} align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={searchInput}
            onValueChange={setSearchInput}
            placeholder={searchPlaceholder}
            className="h-8"
          />
          {hint ? (
            <div className="text-muted-foreground border-b px-3 py-2 text-[11px]">{hint}</div>
          ) : null}
          <CommandList ref={listRef} className={listClassName}>
            {clearLabel ? (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  data-checked={!value}
                  onSelect={() => handleSelect(null)}
                >
                  {clearLabel}
                </CommandItem>
              </CommandGroup>
            ) : null}
            {options.length > 0 ? (
              <>
                <CommandGroup>
                  {options.map((option) => {
                    const optionKey = getOptionKey(option);

                    return (
                      <CommandItem
                        key={optionKey}
                        value={getOptionKeywords?.(option) ?? getOptionLabel(option)}
                        data-checked={value === optionKey}
                        onSelect={() => handleSelect(option)}
                      >
                        {renderOption?.(option) ?? (
                          <span className="block min-w-0 flex-1 truncate">
                            {getOptionLabel(option)}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <SearchableSelectLoadMore
                  listRef={listRef}
                  enabled={isOpen}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={onLoadMore}
                  loadingMoreMessage={loadingMoreMessage}
                />
              </>
            ) : (
              <div className="text-muted-foreground py-6 text-center text-sm">
                {isLoading ? (loadingMessage ?? emptyMessage) : emptyMessage}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
