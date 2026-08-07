'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MoreHorizontal, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getCrmBrandsByIdQueryKey,
  getCrmBrandsOptions,
  getCrmBrandsQueryKey,
  patchCrmBrandsByIdMutation,
  postCrmBrandsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmBrandsResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { BrandFormSheet } from './_components/brand-form-sheet';
import { BrandsSearchLayout } from './_components/brands-search-layout';
import { useBrandsFilters } from './_hooks/use-brands-filters';
import type { BrandFormValues } from './_schemas/brand-form.schema';

const EMPTY_FORM_VALUES: BrandFormValues = {
  brandId: '',
  displayName: '',
};
type BrandListItem = GetCrmBrandsResponse['brands'][number];

function buildInitialValues(brand: BrandListItem | null): BrandFormValues {
  if (!brand) return EMPTY_FORM_VALUES;

  return {
    brandId: brand.brand_id,
    displayName: brand.display_name,
  };
}

function BrandsPageContent() {
  const router = useRouter();
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandListItem | null>(null);
  const filtersHook = useBrandsFilters();
  const {
    filters,
    setFilters,
    clearFilters,
    queryParams,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  } = filtersHook;
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmBrandsOptions({ query: queryParams }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    ...postCrmBrandsMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'ブランドを作成しました');
      void queryClient.invalidateQueries({ queryKey: getCrmBrandsQueryKey() });
      handleSheetOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    ...patchCrmBrandsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'ブランド設定を保存しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmBrandsQueryKey(),
        refetchType: 'all',
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdQueryKey({ path: { id: response.brand.code } }),
        refetchType: 'all',
      });
      handleSheetOpenChange(false);
    },
  });

  const brands = useMemo(() => data?.brands ?? [], [data?.brands]);
  const pagination = data?.pagination;
  const totalBrands = pagination?.all_total ?? 0;
  const filteredTotal = pagination?.total ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;
  const totalPages = pagination?.total_pages ?? Math.max(1, Math.ceil(filteredTotal / limit) || 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const sheetOpen = sheetMode !== null;

  const handleCreateClick = () => {
    setSelectedBrand(null);
    setSheetMode('create');
  };

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

  const handleApplySearch = useCallback(
    (search: string) => {
      setFilters({ search: search || null, page: 1 });
    },
    [setFilters],
  );

  const handleSaveBrand = (values: BrandFormValues, onError: (message: string) => void) => {
    const normalizedBrandId = values.brandId.trim().toLowerCase();

    if (sheetMode === 'create') {
      createMutation.mutate(
        {
          body: {
            display_name: values.displayName.trim(),
            brand_id: normalizedBrandId,
          },
        },
        {
          onError: (error) => {
            if (
              error &&
              typeof error === 'object' &&
              'error' in error &&
              typeof error.error === 'string'
            ) {
              onError(error.error);
              return;
            }

            onError('ブランドの作成に失敗しました。後で再試行してください。');
          },
        },
      );
      return;
    }

    if (sheetMode === 'edit' && selectedBrand) {
      updateMutation.mutate(
        {
          path: { id: selectedBrand.code },
          body: {
            display_name: values.displayName.trim(),
            brand_id: normalizedBrandId,
          },
        },
        {
          onError: (error) => {
            if (
              error &&
              typeof error === 'object' &&
              'error' in error &&
              typeof error.error === 'string'
            ) {
              onError(error.error);
              return;
            }

            onError('ブランド設定の更新に失敗しました。後で再試行してください。');
          },
        },
      );
      return;
    }

    onError('ブランド設定の更新に失敗しました。後で再試行してください。');
  };

  return (
    <div>
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
        actions={
          <RoleGatedButton
            requiredPermission={Permission.BrandsCreate}
            type="button"
            className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
            onClick={handleCreateClick}
          >
            <Plus className="size-3.5" />
            新規登録
          </RoleGatedButton>
        }
      />

      <div className="bg-background flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-4">
        <BrandsSearchLayout
          totalBrands={totalBrands}
          filteredTotal={filteredTotal}
          committedSearch={filters.search}
          currentPage={safePage}
          pageSize={limit}
          isFetching={isFetching}
          onApplySearch={handleApplySearch}
          onClearFilters={clearFilters}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        >
          <div className="overflow-x-auto border-t">
            <Table className="min-w-[760px] text-xs">
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/50 sticky top-0 z-10 w-[100px] px-4 text-xs font-semibold">
                    ブランドID
                  </TableHead>
                  <TableHead className="bg-muted/50 sticky top-0 z-10 px-4 text-xs font-semibold">
                    ブランド名
                  </TableHead>
                  <TableHead className="bg-muted/50 sticky top-0 z-10 w-10 px-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && brands.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="h-40 px-4">
                      <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 text-xs">
                        <Loader2 className="size-5 animate-spin" />
                        読み込み中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="h-40 px-4">
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <p className="text-muted-foreground text-xs">
                          ブランド一覧の取得に失敗しました。
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-4"
                          onClick={() => refetch()}
                        >
                          再読み込み
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : brands.length > 0 ? (
                  brands.map((brand) => (
                    <TableRow
                      key={brand.code}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/brands/${brand.code}`)}
                    >
                      <TableCell className="px-4 py-3 font-mono text-xs text-slate-500">
                        {brand.brand_id}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs font-medium">
                        {brand.display_name}
                      </TableCell>
                      <TableCell
                        className="px-4 py-3 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 rounded-md p-0 text-slate-500"
                              />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <RoleGatedMenuItem
                              requiredPermission={Permission.BrandsEdit}
                              onClick={() => handleEditClick(brand)}
                            >
                              <Pencil className="size-4" />
                              編集
                            </RoleGatedMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="h-40 px-4">
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <p className="text-muted-foreground text-xs">該当のデータがありません。</p>
                        {filters.search.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-4"
                            onClick={clearFilters}
                          >
                            条件をクリア
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </BrandsSearchLayout>
      </div>

      <BrandFormSheet
        open={sheetOpen}
        mode={sheetMode ?? 'create'}
        initialValues={buildInitialValues(selectedBrand)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onOpenChange={handleSheetOpenChange}
        onSave={handleSaveBrand}
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
