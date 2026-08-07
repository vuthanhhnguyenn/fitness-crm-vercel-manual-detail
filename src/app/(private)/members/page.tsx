'use client';

import { Suspense, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table';
import { Plus, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import {
  getCrmMainContractsOptions,
  getCrmMembersOptions,
  getCrmMembersQueryKey,
  getCrmMembersSummaryOptions,
  getCrmMembersSummaryQueryKey,
  patchCrmMembersByIdContractsMainContractChangeMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMainContractsResponse, GetCrmMembersResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { MemberBulkContractDialog } from './_components/member-bulk-contract-dialog';
import { MembersFilters } from './_components/members-filters';
import SummaryMembers from './_components/members-summary';
import { MembersTableColumns } from './_components/members-table-columns';
import { MembersFiltersProvider } from './_contexts/members-filters-context';
import { useMembersFilters } from './_hooks/use-members-filters';

function formatNextMonthStart() {
  const now = new Date();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${nextMonthStart.getFullYear()}年${nextMonthStart.getMonth() + 1}月${nextMonthStart.getDate()}日`;
}

type ContractOption = GetCrmMainContractsResponse['main_contracts'][number];

function MembersPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [toContract, setToContract] = useState<ContractOption | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectedIDs = Object.keys(rowSelection);

  const filtersHook = useMembersFilters();
  const { queryParams, filters, setFilters, currentPage, setCurrentPage, pageSize } = filtersHook;

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

  const { data: summary } = useQuery({
    ...getCrmMembersSummaryOptions(),
  });

  const { data, isLoading } = useQuery({
    ...getCrmMembersOptions({
      query: queryParams,
    }),
  });
  const { data: mainContractsData } = useQuery({
    ...getCrmMainContractsOptions({
      query: {
        page: 1,
        limit: 100,
      },
    }),
  });

  const members = useMemo(() => data?.members ?? [], [data?.members]);
  const pagination = data?.pagination;
  const totalMembers = pagination?.total ?? 0;
  const totalPages = pagination?.total_pages ?? 0;
  const page = pagination?.page ?? currentPage;
  const limit = pagination?.limit ?? pageSize;
  const selectedMembers = useMemo(
    () => members.filter((member) => member.id && selectedIDs.includes(member.id)),
    [members, selectedIDs],
  );

  const contractOptions = useMemo(() => {
    return mainContractsData?.main_contracts ?? [];
  }, [mainContractsData?.main_contracts]);

  const handleContractChange = (contractId: string) => {
    const nextContract = contractOptions.find((contract) => contract.id === contractId) ?? null;
    setToContract(nextContract);
  };

  const applyDateLabel = formatNextMonthStart();

  const { mutateAsync: changeMainContract, isPending: isChangingMainContract } = useMutation({
    ...patchCrmMembersByIdContractsMainContractChangeMutation(),
  });

  const handleOpenBulkDialog = () => {
    setToContract(null);
    setBulkDialogOpen(true);
  };

  const handleBulkChangeContract = async () => {
    if (!toContract || selectedIDs.length === 0) return;

    const results = await Promise.allSettled(
      selectedIDs.map((memberId) =>
        changeMainContract({
          path: { id: memberId },
          body: { contract_id: toContract.id },
        }),
      ),
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const failedCount = results.length - successCount;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getCrmMembersQueryKey({ query: queryParams }),
      }),
      queryClient.invalidateQueries({
        queryKey: getCrmMembersSummaryQueryKey(),
      }),
    ]);

    if (successCount > 0) {
      toast.success(`${successCount}名の主契約を変更しました（${applyDateLabel} 適用）`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount}名の主契約変更に失敗しました`);
    }

    setBulkDialogOpen(false);
    setRowSelection({});
    setToContract(null);
  };

  const columns: ColumnDef<NonNullable<GetCrmMembersResponse['members']>[0]>[] =
    MembersTableColumns({
      onMemberClick: (memberId) => {
        router.push(navigate('/members/[id]', memberId));
      },
    });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">会員一覧</h1>
          <Badge variant="secondary" className="text-xs">
            {totalMembers.toLocaleString()}名
          </Badge>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-1"
          onClick={() => router.push(navigate('/members/create'))}
        >
          <Plus className="size-4" />
          新規登録
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <SummaryMembers summary={summary} />

        <Card className="gap-0 overflow-hidden rounded-xl p-0">
          <div className="px-4 py-3">
            <MembersFiltersProvider value={filtersHook}>
              <MembersFilters isFilterOpen={isFilterOpen} onFilterOpenChange={setIsFilterOpen} />
            </MembersFiltersProvider>

            {selectedIDs.length > 0 && (
              <div className="bg-primary/10 border-primary/20 mt-3 flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="text-primary text-sm font-medium">
                  {selectedIDs.length}名選択中
                </span>
                <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                  選択解除
                </Button>
                <div className="bg-primary/20 h-4 w-px" />
                <Button size="sm" className="gap-1" onClick={handleOpenBulkDialog}>
                  <Shuffle className="size-4" />
                  主契約を変更（{selectedIDs.length}名）
                </Button>
              </div>
            )}
          </div>

          <DataTable
            columns={columns}
            data={members}
            isLoading={isLoading}
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
              onRowSelectionChange: setRowSelection,
            }}
          />

          {totalMembers > 0 && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={totalMembers}
              limit={limit}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              showPageNumbers={false}
            />
          )}
        </Card>
      </div>

      <MemberBulkContractDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedMemberIds={selectedIDs}
        selectedMembers={selectedMembers}
        toContract={toContract}
        onContractChange={handleContractChange}
        contractOptions={contractOptions}
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
