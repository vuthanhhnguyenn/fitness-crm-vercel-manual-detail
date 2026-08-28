'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { formatNextMonthStart, nextMonthStartISO } from '@/utils/format.util';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table';
import { Eye, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

import { Empty } from '@/components/common/data-state-boundary/empty';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { FilterResultBanner } from '@/components/common/filter-result-banner';
import { TablePaginationWithSize } from '@/components/common/table-pagination-with-size';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';

import {
  getCrmMembersOptions,
  getCrmMembersQueryKey,
  postCrmMembersBulkPlanChangesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmMainContractsResponse,
  GetCrmMembersResponse,
  MainBrand,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { MemberBulkContractDialog } from './_components/member-bulk-contract-dialog';
import { MembersFilters } from './_components/members-filters';
import { MembersTableColumns } from './_components/members-table-columns';
import {
  BRAND_GROUP_LABELS,
  JOIN_PERIOD_LABELS,
  LAST_VISIT_LABELS,
  MEMBER_STATUS_FILTER_OPTIONS,
} from './_constants/constants';
import { MembersFiltersProvider } from './_contexts/members-filters-context';
import { useMembersFilters } from './_hooks/use-members-filters';

/**
 * Pull the conflicting member ids out of an `E-BPC-205` response. The generated
 * client surfaces the parsed body on the thrown error, but its type is opaque, so
 * the shape is checked at runtime rather than cast.
 */
function extractConflictingMemberIds(error: unknown): string[] {
  const body = (error as { error?: unknown })?.error ?? error;
  if (!body || typeof body !== 'object') return [];
  const record = body as { code?: unknown; details?: { conflicting_member_ids?: unknown } };
  if (record.code !== 'E-BPC-205') return [];
  const ids = record.details?.conflicting_member_ids;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

type ContractOption = GetCrmMainContractsResponse['main_contracts'][number];
type MemberItem = NonNullable<GetCrmMembersResponse['members']>[number];

function MembersPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasRole } = useAuthUser();
  // FR-020 / permission matrix: bulk main-contract change is HQ/System only
  const canBulkChange = hasRole([UserRole.Headquarter, UserRole.System]);

  const handleEditMember = useCallback(
    (memberId: string) => {
      router.push(navigate('/members/[id]/edit', memberId));
    },
    [router],
  );

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // Full member objects for every selected id, accumulated across pages so the
  // "selected only" view and the dialog preview work beyond the current page.
  const [selectedMap, setSelectedMap] = useState<Record<string, MemberItem>>({});
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectAllDialogOpen, setSelectAllDialogOpen] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);

  const selectedIDs = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const filtersHook = useMembersFilters();
  const {
    queryParams,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    clearFilters,
    hasActiveFilters,
    isAllStoresScope,
    storeFilterLabel,
    contractFilterLabel,
    promoCodeLabel,
  } = filtersHook;

  const sorting: SortingState = filters.sort_by
    ? [{ id: filters.sort_by, desc: filters.sort_order === 'desc' }]
    : [];

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    // FR-011: changing sort resets to the first page
    if (next.length === 0) {
      setFilters({ sort_by: null, sort_order: null, page: 1 });
    } else {
      setFilters({ sort_by: next[0].id, sort_order: next[0].desc ? 'desc' : 'asc', page: 1 });
    }
  };

  const { data, isLoading, isFetching } = useQuery({
    ...getCrmMembersOptions({
      query: queryParams,
    }),
    placeholderData: keepPreviousData,
  });
  const members = useMemo(() => data?.members ?? [], [data?.members]);
  const pagination = data?.pagination;
  const totalMembers = pagination?.total ?? 0;
  // Unfiltered in-scope total for the filter-result banner ("全 X 件中 Y 件")
  const totalAllItems = pagination?.totalAllItems ?? totalMembers;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;
  // Filtered result spans more than the current page → header checkbox offers "select all"
  const hasMorePages = totalMembers > members.length;

  // Requested page out of range: the API falls back to the last valid page, so mirror
  // the page it actually served back into the URL — otherwise the footer/URL would
  // disagree with the rows on screen. Only once the fetch settles: mid-flight the
  // response still describes the previous page (`keepPreviousData`).
  useEffect(() => {
    if (!isFetching && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [isFetching, page, currentPage, setCurrentPage]);

  // Update both the row-selection state and the accumulated object map together,
  // capturing objects for rows visible on the current page and dropping deselected ones.
  const handleRowSelectionChange = (
    updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState),
  ) => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater;
    setRowSelection(next);
    setSelectedMap((prevMap) => {
      const map = { ...prevMap };
      for (const member of members) {
        if (member.id && next[member.id] && !map[member.id]) {
          map[member.id] = member;
        }
      }
      for (const id of Object.keys(map)) {
        if (!next[id]) delete map[id];
      }
      return map;
    });
  };

  // Selected member objects (across pages) for the dialog preview and selected-only view
  const selectedMembers = useMemo(
    () => selectedIDs.map((id) => selectedMap[id]).filter(Boolean) as MemberItem[],
    [selectedIDs, selectedMap],
  );
  // "Selected only" applies only while a selection exists
  const showSelectedOnlyActive = showSelectedOnly && selectedIDs.length > 0;
  const displayMembers = showSelectedOnlyActive ? selectedMembers : members;

  // Number of currently-loaded (this page) rows that are selected
  const selectedOnPage = useMemo(
    () => members.filter((member) => member.id && selectedIDs.includes(member.id)).length,
    [members, selectedIDs],
  );

  // Active-filter summary shown in the filter-result banner. Store/contract names
  // come from the shared filter labels (single source of truth in the hook).
  const filterSummary = useMemo(() => {
    return [
      filters.search ? `"${filters.search}"` : '',
      isAllStoresScope ? (storeFilterLabel ?? '') : '',
      MEMBER_STATUS_FILTER_OPTIONS.find((option) => option.value === filters.status_group)?.label ??
        '',
      contractFilterLabel ?? '',
      filters.brand_group[0] ? BRAND_GROUP_LABELS[filters.brand_group[0] as MainBrand] : '',
      filters.join_period ? `入会: ${JOIN_PERIOD_LABELS[filters.join_period] ?? ''}` : '',
      filters.last_visit ? `来館: ${LAST_VISIT_LABELS[filters.last_visit] ?? ''}` : '',
      promoCodeLabel ? `プロモ: ${promoCodeLabel}` : '',
    ];
  }, [
    filters.search,
    filters.status_group,
    filters.brand_group,
    filters.join_period,
    filters.last_visit,
    promoCodeLabel,
    isAllStoresScope,
    storeFilterLabel,
    contractFilterLabel,
  ]);

  const applyDateLabel = formatNextMonthStart();

  const clearSelection = () => {
    setRowSelection({});
    setSelectedMap({});
    setShowSelectedOnly(false);
  };

  // Select every member matching the current filter (across all pages) — A-01 select-all
  const handleSelectAll = async () => {
    setIsSelectingAll(true);
    try {
      const result = await queryClient.fetchQuery(
        getCrmMembersOptions({
          query: { ...queryParams, page: 1, limit: Math.max(totalMembers, 1) },
        }),
      );
      const allMembers = result?.members ?? [];
      const nextSelection: RowSelectionState = {};
      const nextMap: Record<string, MemberItem> = {};
      for (const member of allMembers) {
        if (member.id) {
          nextSelection[member.id] = true;
          nextMap[member.id] = member;
        }
      }
      setRowSelection(nextSelection);
      setSelectedMap(nextMap);
    } finally {
      setIsSelectingAll(false);
      setSelectAllDialogOpen(false);
    }
  };

  const { mutateAsync: bulkChangeContract, isPending: isChangingMainContract } = useMutation({
    ...postCrmMembersBulkPlanChangesMutation(),
  });

  const handleBulkChangeContract = async (contract: ContractOption) => {
    if (selectedIDs.length === 0) return;

    try {
      const result = await bulkChangeContract({
        body: {
          member_ids: selectedIDs,
          contract_id: contract.id,
          // The apply date is chosen by the client, not the server (QA09 §2.1).
          effective_date: nextMonthStartISO(),
        },
      });

      await queryClient.invalidateQueries({
        queryKey: getCrmMembersQueryKey({ query: queryParams }),
      });

      // A bulk change is BOOKED, not applied: nothing moves until the apply date,
      // so the wording says "reserved" — same as the prototype.
      toast.success(`${result.scheduled_count}名の主契約変更を予約しました`, {
        description: `${applyDateLabel}に適用されます`,
      });
    } catch (error) {
      // E-BPC-205: some of the selection already has a booked change. Name them so
      // the operator can deselect, instead of failing with a generic message.
      const conflicting = extractConflictingMemberIds(error);
      if (conflicting.length > 0) {
        toast.error('一部の会員に既に変更予約があります', {
          description: `${conflicting.slice(0, 3).join('、')}${
            conflicting.length > 3 ? ` ほか${conflicting.length - 3}名` : ''
          } を選択から外して再実行してください`,
        });
      } else {
        toast.error('主契約の一括変更に失敗しました');
      }
    } finally {
      setBulkDialogOpen(false);
      clearSelection();
    }
  };

  // Memoize so the column defs (and their inline `header` render functions) keep a
  // stable identity across renders. `flexRender` treats `columnDef.header` as a
  // component type, so a fresh function each render remounts the header cell — which
  // during the keepPreviousData refetch on sort remounts the sort tooltip and
  // replays its enter animation as a visible blink.
  const columns: ColumnDef<NonNullable<GetCrmMembersResponse['members']>[0]>[] = useMemo(
    () =>
      MembersTableColumns({
        canBulkChange,
        hasMorePages,
        onRequestSelectAll: () => setSelectAllDialogOpen(true),
        onEditClick: handleEditMember,
      }),
    [canBulkChange, hasMorePages, handleEditMember],
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 px-6 pt-6">
        <h1 className="text-xl font-bold">会員一覧</h1>
        <Badge variant="secondary" className="text-xs">
          {totalMembers.toLocaleString()}名
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <Card className="gap-0 overflow-hidden rounded-xl p-0">
          <div className="px-4 py-3">
            <MembersFiltersProvider value={filtersHook}>
              <MembersFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </MembersFiltersProvider>

            {canBulkChange && selectedIDs.length > 0 && (
              <div className="bg-primary/10 border-primary/20 mt-3 flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="text-primary text-sm font-medium">
                  {selectedIDs.length}名選択中
                </span>
                <span className="text-muted-foreground text-xs">
                  （このページで {selectedOnPage}名）
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  選択解除
                </Button>
                <div className="bg-primary/20 h-4 w-px" />
                <Toggle
                  pressed={showSelectedOnlyActive}
                  onPressedChange={setShowSelectedOnly}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                >
                  <Eye className="size-3" />
                  選択中のみ表示
                </Toggle>
                <div className="bg-primary/20 h-4 w-px" />
                <Button size="sm" className="gap-1" onClick={() => setBulkDialogOpen(true)}>
                  <Shuffle className="size-4" />
                  主契約を変更（{selectedIDs.length}名）
                </Button>
              </div>
            )}
          </div>

          <FilterResultBanner
            show={hasActiveFilters}
            totalCount={totalAllItems}
            filteredCount={totalMembers}
            filterSummary={filterSummary}
            onClear={clearFilters}
          />

          <DataTable
            columns={columns}
            data={displayMembers}
            isLoading={isLoading}
            isFetching={isFetching}
            variant="simple"
            onRowClick={(row) => {
              router.push(navigate('/members/[id]', row.id));
            }}
            className="rounded-none border-x-0 border-b-0"
            containerClassName={
              isFilterOpen ? 'max-h-[calc(100vh-340px)]' : 'max-h-[calc(100vh-290px)]'
            }
            tableOptions={{
              onSortingChange: handleSortingChange,
              manualSorting: true,
              state: {
                sorting,
                rowSelection,
              },
              getRowId: (originalRow) => originalRow?.id,
              onRowSelectionChange: handleRowSelectionChange,
            }}
            emptyContent={
              <Empty
                variant={hasActiveFilters ? 'filtered' : 'empty'}
                entityLabel="会員"
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            }
          />

          {!showSelectedOnlyActive && totalMembers > 0 && (
            <TablePaginationWithSize
              currentPage={page}
              total={totalMembers}
              pageSize={limit}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      {/* Select-all confirmation (2-step) — A-01 cross-page bulk selection */}
      <AlertDialog open={selectAllDialogOpen} onOpenChange={setSelectAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>該当する全件を選択しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のフィルター条件に該当する <strong>{totalMembers}件</strong>{' '}
              すべてを選択しますか？ 現在ページ（{members.length}
              件）のみの選択を維持する場合はキャンセルしてください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSelectingAll}>このページのみ選択</AlertDialogCancel>
            <AlertDialogAction disabled={isSelectingAll} onClick={handleSelectAll}>
              {totalMembers}件すべてを選択
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MemberBulkContractDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedMemberIds={selectedIDs}
        selectedMembers={selectedMembers}
        isChangingMainContract={isChangingMainContract}
        onExecute={handleBulkChangeContract}
      />
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MembersPageContent />
    </Suspense>
  );
}
