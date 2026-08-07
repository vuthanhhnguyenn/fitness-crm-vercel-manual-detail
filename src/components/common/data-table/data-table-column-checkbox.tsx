import { ButtonProps } from '@base-ui/react';
import type { Row } from '@tanstack/react-table';

import { Checkbox } from '@/components/ui/checkbox';

import { cn } from '@/lib/utils';

interface DataTableColumnCheckboxProps<TData> extends ButtonProps {
  row: Row<TData>;
  title?: string;
}

export function DataTableColumnCheckbox<TData>({
  row,
  className,
}: DataTableColumnCheckboxProps<TData>) {
  return (
    <div className={cn('w-8 px-2', className)} onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={row.getIsSelected()}
        aria-label="select row"
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        className="translate-y-0.5"
      />
    </div>
  );
}
