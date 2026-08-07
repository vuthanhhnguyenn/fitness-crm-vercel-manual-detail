import { ButtonProps } from '@base-ui/react';
import type { Column } from '@tanstack/react-table';
import { MoveDown, MoveUp } from 'lucide-react';

import { Button } from '@/components/ui/button';

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

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        column.toggleSorting(column.getIsSorted() === 'asc');
      }}
      className={cn(
        'flex h-7 w-full items-center justify-start gap-2 px-0 py-0 hover:bg-transparent',
        className,
      )}
      {...props}
    >
      <span className="text-xs font-semibold">{title}</span>
      <span className="flex items-center justify-center">
        <MoveUp
          className={cn(
            '-mr-[2px] size-[14px]',
            column.getIsSorted() === 'asc' ? 'text-foreground' : 'text-muted-foreground',
          )}
        />
        <MoveDown
          className={cn(
            '-ml-[5px] size-[14px]',
            column.getIsSorted() === 'desc' ? 'text-foreground' : 'text-muted-foreground',
          )}
        />
      </span>
    </Button>
  );
}
