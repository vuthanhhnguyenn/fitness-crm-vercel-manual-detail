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

import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  pages.push(1);

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TablePaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  total: number;
  /** Number of items per page */
  limit: number;
  /** Called when user clicks a page / prev / next */
  onPageChange: (page: number) => void;
  /** Show skeleton loading state */
  isLoading?: boolean;
  /** Show page numbers */
  showPageNumbers?: boolean;
  /** Additional class for the container */
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TablePagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  isLoading = false,
  showPageNumbers = true,
  className,
}: TablePaginationProps) {
  const startItem = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className={cn('flex items-center justify-between border-t px-4 py-3', className)}>
      {/* Summary text */}
      <p className="text-muted-foreground text-xs">
        {isLoading ? (
          <span className="bg-muted inline-block h-3.5 w-28 animate-pulse rounded" />
        ) : (
          <>
            {total}件中 {startItem}-{endItem} 件を表示
          </>
        )}
      </p>

      {/* Page controls */}
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent className="gap-1">
          <PaginationItem className="rounded-md border">
            <PaginationPrevious
              text="前へ"
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={cn(
                'h-8 cursor-pointer',
                isLoading || (currentPage <= 1 && 'pointer-events-none opacity-50'),
              )}
            />
          </PaginationItem>

          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <PaginationItem key={i}>
                  <span className="bg-muted flex size-9 animate-pulse rounded-md" />
                </PaginationItem>
              ))
            : showPageNumbers
              ? pageNumbers.map((page, index) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => onPageChange(page)}
                        className="h-8 cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )
              : null}

          <PaginationItem className="rounded-md border">
            <PaginationNext
              text="次へ"
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={cn(
                'h-8 cursor-pointer',
                isLoading || (currentPage >= totalPages && 'pointer-events-none opacity-50'),
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
