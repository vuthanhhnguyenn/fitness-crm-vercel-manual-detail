'use client';

import React from 'react';

import {
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  RefetchOptions,
} from '@tanstack/react-query';
import {
  ColumnDef,
  Table as TableInstance,
  TableOptions,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LoaderCircle } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';

import { Button } from '../../ui/button';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  variant?: 'default' | 'simple'; // 'default' = infinite scroll, 'simple' = standard table
  isFetching?: boolean;
  isLoading?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: (options?: FetchNextPageOptions | undefined) => Promise<unknown>;
  fetchPreviousPage?: (options?: FetchPreviousPageOptions | undefined) => Promise<unknown>;
  refetch?: (options?: RefetchOptions | undefined) => void;
  totalRows?: number;
  filterRows?: number;
  totalRowsFetched?: number;
  className?: string;
  onRowClick?: (row: TData) => void;
  onTableReady?: (table: TableInstance<TData>) => void;
  /**
   * Additional options passed to TanStack `useReactTable`.
   * Note: `data` and `columns` are controlled by `DataTable` props.
   */
  tableOptions?: Omit<Partial<TableOptions<TData>>, 'data' | 'columns'>;
  containerClassName?: string;
  tableSize?: 'default' | 'md';
  getRowClassName?: (row: TData) => string | undefined;
  emptyContent?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  variant = 'default',
  isFetching,
  isLoading,
  fetchNextPage,
  hasNextPage,
  // fetchPreviousPage,
  // refetch,
  totalRows = 0,
  filterRows = 0,
  totalRowsFetched = 0,
  className,
  onRowClick,
  onTableReady,
  tableOptions,
  containerClassName,
  tableSize = 'default',
  getRowClassName,
  emptyContent,
}: Readonly<DataTableProps<TData, TValue>>) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...tableOptions,
  });
  const tableRef = React.useRef<HTMLTableElement>(null);
  const onScroll = React.useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
      const onPageBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 5;

      if (onPageBottom && !isFetching && hasNextPage) {
        fetchNextPage?.();
      }
    },
    [fetchNextPage, isFetching, hasNextPage],
  );

  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  const renderEmptyState = () => (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns.length} className={cn(emptyContent ? 'p-0' : 'h-24 text-center')}>
        {emptyContent ?? 'データがありません'}
      </TableCell>
    </TableRow>
  );

  // Simple table mode (no pagination)
  if (variant === 'simple') {
    return (
      <div className={cn('overflow-hidden rounded-md border', className)}>
        <Table size={tableSize} containerClassName={cn('overflow-y-auto', containerClassName)}>
          <TableHeader className="overflow-hidden">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as Record<string, unknown> | undefined;
                  return (
                    <TableHead key={header.id} className={meta?.className as string}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 20 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : table.getRowModel().rows?.length
                ? table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(
                        onRowClick ? 'cursor-pointer' : '',
                        getRowClassName?.(row.original) ?? '',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            (cell.column.columnDef.meta as Record<string, unknown> | undefined)
                              ?.className as string
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : renderEmptyState()}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Default mode (infinite scroll)
  return (
    <div className={cn('overflow-hidden', className)}>
      <Table
        ref={tableRef}
        onScroll={onScroll}
        size={tableSize}
        containerClassName={cn('rounded-md border overflow-y-auto', containerClassName)}
      >
        <TableHeader className="z-20">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className={cn('bg-neutral-100 hover:bg-neutral-200', '[&>*]:border-b')}
            >
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      (header.column.columnDef.meta as Record<string, unknown> | undefined)
                        ?.className as string,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 20 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <>
              {table.getRowModel().rows?.length
                ? table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(
                        onRowClick ? 'cursor-pointer' : '',
                        getRowClassName?.(row.original) ?? '',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            (cell.column.columnDef.meta as Record<string, unknown> | undefined)
                              ?.className as string,
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : renderEmptyState()}
              <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent">
                <TableCell colSpan={columns.length} className="py-3 text-center">
                  {isFetching ? (
                    <LoaderCircle className="text-muted-foreground mx-auto h-5 w-5 animate-spin" />
                  ) : hasNextPage ? (
                    <Button onClick={() => fetchNextPage?.()} size="sm" variant="outline">
                      もっと見る
                    </Button>
                  ) : totalRowsFetched > 50 && table.getRowModel().rows.length > 0 ? (
                    <p className="text-muted-foreground text-sm">
                      これ以上のデータはありません ({' '}
                      <span className="font-mono font-medium">{filterRows}</span> 件中{' '}
                      <span className="font-mono font-medium">{totalRows}</span> 件)
                    </p>
                  ) : null}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
