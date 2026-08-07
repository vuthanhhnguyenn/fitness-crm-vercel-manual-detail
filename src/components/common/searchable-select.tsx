'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { ChevronsUpDown } from 'lucide-react';

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

import { cn } from '@/lib/utils';

const DEFAULT_SEARCH_DEBOUNCE_MS = 300;

interface SearchableSelectProps<TItem> {
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
}: SearchableSelectProps<TItem>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

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
          <CommandList className={listClassName}>
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
