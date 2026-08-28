'use client';

// Client component: popover open state + command palette interaction
import { useState } from 'react';

import { Check, Filter } from 'lucide-react';

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

import { cn } from '@/lib/utils';

import {
  POSITION_PERMISSION_CATEGORIES,
  type PositionPermissionKey,
} from '../_constants/position-permissions.constant';

type PositionPermissionFilterProps = {
  selectedKey: PositionPermissionKey | null;
  onSelect: (key: PositionPermissionKey) => void;
};

/** Reverse permission filter — 権限で絞り込む (FR-003 / PAR009-PAR014) */
export function PositionPermissionFilter({ selectedKey, onSelect }: PositionPermissionFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant={selectedKey ? 'default' : 'outline'}
            size="sm"
            className="h-8 shrink-0 gap-1 text-xs"
          />
        }
      >
        <Filter className="size-3" />
        権限で絞り込む
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="権限を検索..." className="text-xs" />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>該当する権限がありません</CommandEmpty>
            {POSITION_PERMISSION_CATEGORIES.map((category) => (
              <CommandGroup key={category.categoryKey} heading={category.categoryLabel}>
                {category.permissions.map((permission) => (
                  <CommandItem
                    key={permission.key}
                    value={`${category.categoryLabel} ${permission.label}`}
                    onSelect={() => {
                      onSelect(permission.key);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'size-3 shrink-0',
                        selectedKey === permission.key ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="text-xs">{permission.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Resolves the display label for a permission key (filter banner summary) */
export function findPermissionLabel(key: PositionPermissionKey): string {
  for (const category of POSITION_PERMISSION_CATEGORIES) {
    const found = category.permissions.find((permission) => permission.key === key);
    if (found) return found.label;
  }
  return key;
}
