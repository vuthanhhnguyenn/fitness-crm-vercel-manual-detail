'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { Empty } from '@/components/common/data-state-boundary/empty';
// Plus icon was used by the create-brand header button — see the commented-out
// block below (Out of scope for this phase — FR-015 / research.md G4).

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { PageHeader } from '@/components/common/page-header';
// RoleGatedButton was used by the create-brand header button — see the
// commented-out block below (Out of scope for this phase — FR-015 / research.md G4).
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
  getCrmBrandsOptions,
  // postCrmBrandsMutation — create-brand flow, commented out below (research.md G4).
} from '@/lib/api/@tanstack/react-query.gen';

import { BrandFormSheet } from './_components/brand-form-sheet';
import { type BrandListItem, BrandTableColumns } from './_components/brand-table-columns';
import { useBrandsFilters } from './_hooks/use-brands-filters';

function BrandsPageContent() {
  const router = useRouter();
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandListItem | null>(null);
  const filtersHook = useBrandsFilters();
  const {
    filters,
    searchInput,
    setSearchInput,
    clearFilters,
    hasActiveFilters,
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = filtersHook;

  const { data, isLoading, isFetching } = useQuery({
    ...getCrmBrandsOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const brands = useMemo(() => data?.brands ?? [], [data?.brands]);
  const pagination = data?.pagination;
  const totalBrands = pagination?.all_total ?? 0;
  const filteredTotal = pagination?.total ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;
  const sheetOpen = sheetMode !== null;

  // Out of scope for this phase — FR-015 / research.md G4. Commented out, not deleted, pending a future phase.
  // const handleCreateClick = () => {
  //   setSelectedBrand(null);
  //   setSheetMode('create');
  // };

  const handleEditClick = (brand: BrandListItem) => {
    setSelectedBrand(brand);
    setSheetMode('edit');
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSheetMode(null);
      setSelectedBrand(null);
    }
  };

  const columns = useMemo(() => BrandTableColumns({ onEditClick: handleEditClick }), []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="ブランド管理"
        className="[&_h1]:text-[18px] [&_h1]:leading-7"
        badge={
          <Badge
            variant="outline"
            className="h-5 rounded-full border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-600"
          >
            {totalBrands}件
          </Badge>
        }
        // Out of scope for this phase — FR-015 / research.md G4. Commented out, not deleted, pending a future phase.
        // actions={
        //   <RoleGatedButton
        //     requiredPermission={Permission.BrandsCreate}
        //     type="button"
        //     className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
        //     onClick={handleCreateClick}
        //   >
        //     <Plus className="size-3.5" />
        //     新規登録
        //   </RoleGatedButton>
        // }
      />

      <div className="bg-background flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        <Card className="flex gap-0 rounded-xl border p-0">
          <div className="px-4 py-3">
            <div className="relative max-w-100">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="キーワードで検索..."
                className="h-8 rounded-md pl-9 text-xs"
                maxLength={TEXT_MAX_LENGTH}
              />
            </div>
          </div>

          <FilterResultBanner
            show={hasActiveFilters}
            totalCount={totalBrands}
            filteredCount={filteredTotal}
            filterSummary={filters.search ? `"${filters.search}"` : ''}
            onClear={clearFilters}
          />

          <DataTable
            tableSize="md"
            isLoading={isLoading}
            isFetching={isFetching}
            columns={columns}
            data={brands}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            onRowClick={(brand) => router.push(`/brands/${brand.code}`)}
            emptyContent={
              <Empty
                variant={hasActiveFilters ? 'filtered' : 'empty'}
                entityLabel="ブランド"
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            }
          />

          {filteredTotal > 0 && (
            <TablePaginationWithSize
              currentPage={page}
              total={filteredTotal}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <BrandFormSheet
        open={sheetOpen}
        mode={sheetMode ?? 'create'}
        brand={selectedBrand}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}

export default function BrandsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BrandsPageContent />
    </Suspense>
  );
}
