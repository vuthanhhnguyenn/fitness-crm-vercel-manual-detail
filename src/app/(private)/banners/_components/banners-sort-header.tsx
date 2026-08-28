'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BannersSortHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function BannersSortHeader<TData, TValue>({
  column,
  title,
}: BannersSortHeaderProps<TData, TValue>) {
  const isSorted = column.getIsSorted();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            variant="ghost"
            className="group/sort h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {title}
            {isSorted === 'asc' ? (
              <ArrowUp className="size-3" />
            ) : isSorted === 'desc' ? (
              <ArrowDown className="size-3" />
            ) : (
              <ArrowUpDown className="text-muted-foreground/40 group-hover/sort:text-foreground size-3 transition-colors" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {isSorted === 'asc' ? 'クリックで降順ソート' : 'クリックで昇順ソート'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
