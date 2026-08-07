'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { Search } from 'lucide-react';

import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const MAX_SEARCH_LENGTH = 255;

interface BrandsSearchLayoutProps {
  totalBrands: number;
  filteredTotal: number;
  committedSearch: string;
  currentPage: number;
  pageSize: number;
  isFetching: boolean;
  onApplySearch: (search: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  children: ReactNode;
}

export function BrandsSearchLayout({
  totalBrands,
  filteredTotal,
  committedSearch,
  currentPage,
  pageSize,
  isFetching,
  onApplySearch,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  children,
}: BrandsSearchLayoutProps) {
  const [searchInput, setSearchInput] = useState(committedSearch);

  useEffect(() => {
    const nextSearch = searchInput.slice(0, MAX_SEARCH_LENGTH);
    const timer = setTimeout(() => {
      if (nextSearch !== committedSearch) {
        onApplySearch(nextSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [committedSearch, onApplySearch, searchInput]);

  const hasSearch = searchInput.length > 0 || committedSearch.length > 0;
  const appliedSearch = searchInput || committedSearch;

  return (
    <>
      {hasSearch && (
        <Alert className="mb-0 flex items-center justify-between gap-4 border-slate-200 bg-white px-4 py-2.5 shadow-none">
          <AlertDescription className="text-muted-foreground min-w-0 text-xs leading-5 break-all whitespace-normal">
            全 {totalBrands} 件中 {filteredTotal} 件を抽出中
            <span className="ml-1 text-slate-500">: &quot;{appliedSearch}&quot;</span>
          </AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 rounded-md px-2 text-xs font-medium text-slate-700"
            onClick={() => {
              setSearchInput('');
              onClearFilters();
            }}
          >
            条件をクリア
          </Button>
        </Alert>
      )}

      <Card className="gap-0 overflow-hidden rounded-lg border p-0">
        <div className="px-4 py-3">
          <div className="relative max-w-[400px]">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value.slice(0, MAX_SEARCH_LENGTH))}
              maxLength={MAX_SEARCH_LENGTH}
              placeholder="キーワードで検索..."
              className="h-8 rounded-md pl-9 text-xs"
            />
          </div>
        </div>

        {children}

        <TablePaginationWithSize
          total={filteredTotal}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          className={isFetching ? 'opacity-80' : ''}
        />
      </Card>
    </>
  );
}
