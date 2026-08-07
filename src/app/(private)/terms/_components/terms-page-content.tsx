'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';

import { getCrmTermsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmTermsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { TermsFiltersProvider } from '../_contexts/terms-filters-context';
import { useTermsFilters } from '../_hooks/use-terms-filters';
import { TermsDeleteDialog } from './terms-delete-dialog';
import { TermsListFilters } from './terms-list-filters';
import { TermsListTable } from './terms-list-table';

type TermsListItem = GetCrmTermsResponse['items'][number];

export function TermsPageContent() {
  const router = useRouter();
  const filtersHook = useTermsFilters();
  const {
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    hasActiveFilters,
    clearFilters,
  } = filtersHook;
  const [selectedTerm, setSelectedTerm] = useState<TermsListItem | null>(null);

  const listQuery = useQuery({
    ...getCrmTermsOptions({
      query: queryParams,
    }),
    placeholderData: keepPreviousData,
  });

  const items: TermsListItem[] = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalAllItems = listQuery.data?.totalAllItems ?? totalItems;

  const termsFiltersValue = {
    ...filtersHook,
    filteredTotal: totalItems,
    totalAllItems,
  };

  return (
    <div>
      <PageHeader
        title="規約文書管理"
        badge={
          <Badge variant="outline" className="text-xs">
            {listQuery.isLoading ? '...' : `${totalItems}件`}
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.TermsCreate}
            className="gap-1"
            onClick={() => {
              router.push(navigate('/terms/create'));
            }}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="bg-background flex flex-1 flex-col gap-4 px-6 py-4">
        <TermsFiltersProvider value={termsFiltersValue}>
          <TermsListFilters>
            <TermsListTable
              items={items}
              total={totalItems}
              currentPage={pagination?.page ?? currentPage}
              pageSize={pagination?.limit ?? pageSize}
              isLoading={listQuery.isLoading}
              isFetching={listQuery.isFetching}
              isError={listQuery.isError}
              hasActiveFilters={hasActiveFilters}
              onRetry={() => {
                void listQuery.refetch();
              }}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              onRowClick={(termId) => {
                router.push(navigate('/terms/[id]', termId));
              }}
              onEditClick={(termId) => {
                router.push(navigate('/terms/[id]/edit', termId));
              }}
              onDeleteClick={(term) => {
                setSelectedTerm(term);
              }}
              onClearFilters={clearFilters}
            />
          </TermsListFilters>
        </TermsFiltersProvider>
      </div>

      {selectedTerm && (
        <TermsDeleteDialog
          termId={selectedTerm.id}
          termName={selectedTerm.title}
          open={Boolean(selectedTerm)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTerm(null);
            }
          }}
        />
      )}
    </div>
  );
}
