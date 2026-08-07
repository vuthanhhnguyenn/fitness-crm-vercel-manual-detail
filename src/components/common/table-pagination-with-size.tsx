'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';

type PageToken = number | 'ellipsis';

function getPageNumbers(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageToken[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('ellipsis');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

interface TablePaginationWithSizeProps {
  readonly total: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly pageSizeOptions?: readonly number[];
  readonly className?: string;
}

export function TablePaginationWithSize({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
  className,
}: TablePaginationWithSizeProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(safePage * pageSize, total);
  const pageNumbers = getPageNumbers(safePage, totalPages);
  const renderedPageItems = pageNumbers.map((page, position) => {
    if (page === 'ellipsis') {
      const previousPage = pageNumbers[position - 1];
      const nextPage = pageNumbers[position + 1];
      const ellipsisKey = `ellipsis-${String(previousPage)}-${String(nextPage)}`;

      return (
        <PaginationItem key={ellipsisKey}>
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    return (
      <PaginationItem key={page}>
        <PaginationLink
          onClick={() => onPageChange(page)}
          isActive={page === safePage}
          className="cursor-pointer"
        >
          {page}
        </PaginationLink>
      </PaginationItem>
    );
  });

  return (
    <div className={cn('flex items-center justify-between gap-4 border-t px-4 py-3', className)}>
      <p className="text-muted-foreground shrink-0 text-xs">
        全 {total} 件 / {totalPages} ページ / {total === 0 ? 0 : startIndex + 1}-{endIndex} を表示
      </p>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              text="前へ"
              onClick={() => onPageChange(safePage - 1)}
              className={safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {renderedPageItems}

          <PaginationItem>
            <PaginationNext
              text="次へ"
              onClick={() => onPageChange(safePage + 1)}
              className={
                safePage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground text-xs">表示件数</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            onPageSizeChange(Number(value));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="h-7 w-[72px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}件
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
