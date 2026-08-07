'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';

import { getCrmOptionDiscountsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmOptionDiscountsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { OptionDiscountDeleteDialog } from './[id]/_components/option-discount-delete-dialog';
import { OptionDiscountFilters } from './_components/option-discount-filters';
import { OptionDiscountTableColumns } from './_components/option-discount-table-columns';
import { OptionDiscountFiltersProvider } from './_contexts/option-discount-filters-context';
import { useOptionDiscountFilters } from './_hooks/use-option-discount-filters';

type OptionDiscountRow = GetCrmOptionDiscountsResponse['option_discounts'][number];

function OptionDiscountPageContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OptionDiscountRow | null>(null);
  const filtersHook = useOptionDiscountFilters();
  const { filters, setFilters, queryParams, currentPage, setCurrentPage, pageSize } = filtersHook;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    ...getCrmOptionDiscountsOptions({
      query: queryParams,
    }),
  });

  const optionDiscounts = data?.option_discounts ?? [];
  const pagination = data?.pagination;
  const totalOptionDiscounts = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;

  const sorting: SortingState = filters.sort_by
    ? [{ id: filters.sort_by, desc: filters.sort_order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;

    if (next.length === 0) {
      setFilters({ sort_by: null, sort_order: null });
    } else {
      setFilters({ sort_by: next[0].id, sort_order: next[0].desc ? 'desc' : 'asc' });
    }
  };

  const columns: ColumnDef<OptionDiscountRow>[] = useMemo(
    () =>
      OptionDiscountTableColumns({
        onEditClick: (id) => {
          router.push(navigate('/option-discount/[id]/edit', id));
        },
        onDeleteClick: (optionDiscount) => {
          setDeleteTarget(optionDiscount);
        },
      }),
    [router],
  );

  return (
    <div>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => router.push(navigate('/options'))}
                >
                  オプション管理
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>セット割設定</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title="セット割設定"
        badge={
          <>
            <Badge variant="secondary">{totalOptionDiscounts}件</Badge>
            <Badge
              variant="outline"
              className="bg-destructive/15 text-destructive border-destructive/20 text-xs font-medium"
            >
              FIT365 限定
            </Badge>
          </>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.OptionDiscountsCreate}
            className="gap-1"
            onClick={() => router.push(navigate('/option-discount/create'))}
          >
            <Plus className="size-4" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Card className="gap-3 overflow-hidden rounded-xl border p-0">
          <div className="p-3 pb-0">
            <OptionDiscountFiltersProvider value={filtersHook}>
              <OptionDiscountFilters
                isFilterOpen={isFilterOpen}
                onFilterOpenChange={setIsFilterOpen}
              />
            </OptionDiscountFiltersProvider>
          </div>

          <DataTable
            columns={columns}
            data={optionDiscounts}
            isLoading={isLoading}
            variant="simple"
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-370px)]' : 'max-h-[calc(100vh-320px)]'
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: { sorting },
            }}
            onRowClick={(row) => {
              router.push(navigate('/option-discount/[id]', row.id));
            }}
          />

          {totalOptionDiscounts > 0 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={totalOptionDiscounts}
              limit={limit}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              showPageNumbers={false}
            />
          )}
        </Card>
      </div>
      <OptionDiscountDeleteDialog
        optionDiscountId={deleteTarget?.id ?? ''}
        optionDiscountName={deleteTarget?.name ?? ''}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        redirectOnSuccess={false}
      />
    </div>
  );
}

export default function OptionDiscountPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OptionDiscountPageContent />
    </Suspense>
  );
}
