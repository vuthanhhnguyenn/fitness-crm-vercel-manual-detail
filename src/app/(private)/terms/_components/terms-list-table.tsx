import { SearchX } from 'lucide-react';

import { DataTable } from '@/components/common/data-table';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Button } from '@/components/ui/button';

import { TERMS_PAGE_SIZE_OPTIONS } from '../_constants/constants';
import { type TermsListItem, getTermsTableColumns } from './terms-table-columns';

interface TermsListTableProps {
  readonly items: TermsListItem[];
  readonly total: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly hasActiveFilters: boolean;
  readonly onRetry: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly onRowClick: (termId: string) => void;
  readonly onEditClick: (termId: string) => void;
  readonly onDeleteClick: (term: TermsListItem) => void;
  readonly onClearFilters: () => void;
}

function TermsListError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <div className="border-destructive/20 bg-destructive/5 flex min-h-32 flex-col items-center justify-center gap-3 border px-4 py-8 text-center">
      <div>
        <p className="text-destructive text-sm font-semibold">規約一覧の取得に失敗しました</p>
        <p className="text-muted-foreground mt-1 text-xs">
          ネットワーク接続を確認して再度お試しください。
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        再試行する
      </Button>
    </div>
  );
}

function TermsListEmpty({
  hasActiveFilters,
  onClearFilters,
}: Readonly<{
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}>) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <SearchX className="text-muted-foreground/60 size-9 stroke-[1.75]" />
      <p className="text-muted-foreground text-sm">条件に一致する規約文書がありません</p>
      {hasActiveFilters ? (
        <Button variant="outline" size="sm" className="text-xs" onClick={onClearFilters}>
          条件をクリア
        </Button>
      ) : null}
    </div>
  );
}

export function TermsListTable({
  items,
  total,
  currentPage,
  pageSize,
  isLoading,
  isFetching,
  isError,
  hasActiveFilters,
  onRetry,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onEditClick,
  onDeleteClick,
  onClearFilters,
}: TermsListTableProps) {
  const columns = getTermsTableColumns({ onEditClick, onDeleteClick });
  const emptyContent = isError ? (
    <TermsListError onRetry={onRetry} />
  ) : (
    <TermsListEmpty hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
  );

  return (
    <>
      <div className="relative">
        {isFetching && !isLoading ? (
          <div className="bg-primary absolute top-0 right-0 left-0 z-20 h-0.5 animate-pulse" />
        ) : null}
        <DataTable
          columns={columns}
          data={isError ? [] : items}
          isLoading={isLoading}
          variant="simple"
          className="rounded-none border-x-0 border-b-0"
          containerClassName="overflow-x-auto"
          onRowClick={(term) => onRowClick(term.id)}
          getRowClassName={(term) =>
            term.isDeleted
              ? 'hover:bg-muted/50 cursor-pointer opacity-50'
              : 'hover:bg-muted/50 cursor-pointer'
          }
          emptyContent={emptyContent}
        />
      </div>

      {!isError && !isLoading ? (
        <TablePaginationWithSize
          currentPage={currentPage}
          total={total}
          pageSize={pageSize}
          onPageChange={(page) => {
            if (!isFetching) {
              onPageChange(page);
            }
          }}
          onPageSizeChange={(nextPageSize) => {
            if (!isFetching) {
              onPageSizeChange(nextPageSize);
            }
          }}
          pageSizeOptions={TERMS_PAGE_SIZE_OPTIONS}
          className="border-t"
        />
      ) : null}
    </>
  );
}
