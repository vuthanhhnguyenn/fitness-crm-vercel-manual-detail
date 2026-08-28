import { ButtonProps } from '@base-ui/react';
import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> extends ButtonProps {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const isSorted = column.getIsSorted();

  function handleSortClick() {
    if (isSorted === false) {
      column.toggleSorting(false);
    } else if (isSorted === 'asc') {
      column.toggleSorting(true);
    } else {
      column.clearSorting();
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            variant="ghost"
            onClick={handleSortClick}
            className={cn(
              'group/sort h-auto gap-1 p-0 text-xs font-semibold hover:bg-transparent',
              className,
            )}
            {...props}
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
            {isSorted === false
              ? 'クリックで昇順ソート'
              : isSorted === 'asc'
                ? 'クリックで降順ソート'
                : 'クリックで解除'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
