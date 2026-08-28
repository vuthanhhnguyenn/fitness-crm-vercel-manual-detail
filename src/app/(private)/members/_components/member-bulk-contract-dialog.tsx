'use client';

import { useMemo, useState } from 'react';

import { formatNextMonthStart } from '@/utils/format.util';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

import { RequiredMark } from '@/components/common/field-marker';
import { SearchableSelect } from '@/components/common/searchable-select';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
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
import { Label } from '@/components/ui/label';

import { getCrmMainContractsInfiniteOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMainContractsResponse, GetCrmMembersResponse } from '@/lib/api/types.gen';

type MemberItem = NonNullable<GetCrmMembersResponse['members']>[0];
type ContractItem = GetCrmMainContractsResponse['main_contracts'][number];

interface MemberBulkContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMemberIds: string[];
  selectedMembers: MemberItem[];
  isChangingMainContract: boolean;
  onExecute: (contract: ContractItem) => void;
}

export function MemberBulkContractDialog({
  open,
  onOpenChange,
  selectedMemberIds,
  selectedMembers,
  isChangingMainContract,
  onExecute,
}: MemberBulkContractDialogProps) {
  // The picked target contract lives here — the parent only needs it on execute.
  const [toContract, setToContract] = useState<ContractItem | null>(null);
  const [contractOpen, setContractOpen] = useState(false);
  const [contractSearch, setContractSearch] = useState('');

  // Clear the pick on close so it never lingers into the next bulk change.
  const handleOpenChange = (next: boolean) => {
    if (!next) setToContract(null);
    onOpenChange(next);
  };

  const {
    data: contractsData,
    isFetching: isContractsFetching,
    fetchNextPage: fetchNextContracts,
    hasNextPage: hasMoreContracts,
    isFetchingNextPage: isFetchingMoreContracts,
  } = useInfiniteQuery({
    ...getCrmMainContractsInfiniteOptions({
      query: { limit: 20, search: contractSearch || undefined },
    }),
    enabled: open && contractOpen,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmMainContractsResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const contractOptions = useMemo(
    () => contractsData?.pages.flatMap((page) => page.main_contracts ?? []) ?? [],
    [contractsData],
  );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>主契約の一括変更</AlertDialogTitle>
          <AlertDialogDescription>
            選択した {selectedMemberIds.length}{' '}
            名の主契約を一括で変更します。変更は翌月月初から適用されます。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">
              変更先の主契約
              <RequiredMark />
            </Label>
            <SearchableSelect<ContractItem>
              value={toContract?.id ?? null}
              valueLabel={toContract?.name ?? '選択してください'}
              options={contractOptions}
              placeholder="選択してください"
              searchPlaceholder="プラン名・コードで検索..."
              emptyMessage="該当するプランがありません"
              loadingMessage="プランを読み込み中..."
              open={contractOpen}
              onOpenChange={setContractOpen}
              onSearchChange={setContractSearch}
              onSelect={(contract) => setToContract(contract)}
              getOptionKey={(contract) => contract.id}
              getOptionLabel={(contract) => contract.name}
              getOptionKeywords={(contract) =>
                [contract.name, contract.code, contract.id].filter(Boolean).join(' ')
              }
              renderOption={(contract) => (
                <TextWithTooltip
                  text={contract.name}
                  wrapperClassName="w-full"
                  className="w-full"
                  side="right"
                  align="center"
                />
              )}
              isLoading={isContractsFetching}
              hasMore={hasMoreContracts}
              isLoadingMore={isFetchingMoreContracts}
              onLoadMore={fetchNextContracts}
              loadingMoreMessage="読み込み中..."
              triggerClassName="h-9 w-full text-sm"
            />
          </div>

          {/* 変更内容プレビュー */}
          {toContract && (
            <div className="bg-muted/50 space-y-2 rounded-md p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-16">変更後:</span>
                <span className="text-primary font-medium">{toContract.name}</span>
                <span className="text-muted-foreground">
                  ¥{toContract.price_including_tax.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-16">適用開始:</span>
                <span className="text-foreground font-medium">
                  {formatNextMonthStart()}（翌月月初）
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">
              対象会員プレビュー（全 {selectedMembers.length} 名）
            </Label>
            <div className="bg-background space-y-1 rounded-md border p-3">
              {selectedMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-20 font-mono">
                    {member.member_number || member.id}
                  </span>
                  <span className="font-medium">{member.name_kanji || '-'}</span>
                  <span className="text-muted-foreground ml-auto">
                    {member.contract_name || '-'}
                  </span>
                  <ArrowRight className="text-muted-foreground size-3" />
                  <span className="text-primary">{toContract?.name || '―'}</span>
                </div>
              ))}
              {selectedMembers.length > 5 && (
                <p className="text-muted-foreground border-t pt-1 text-xs">
                  他 {selectedMembers.length - 5} 名
                </p>
              )}
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isChangingMainContract}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={!toContract || isChangingMainContract}
            onClick={() => {
              if (!toContract) return;
              onExecute(toContract);
              setToContract(null);
            }}
          >
            実行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
