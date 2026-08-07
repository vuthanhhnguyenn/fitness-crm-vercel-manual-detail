'use client';

import { formatNextMonthStart } from '@/utils/format.util';
import { ArrowRight } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { GetCrmMainContractsResponse, GetCrmMembersResponse } from '@/lib/api/types.gen';

type MemberItem = NonNullable<GetCrmMembersResponse['members']>[0];

interface MemberBulkContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMemberIds: string[];
  selectedMembers: MemberItem[];
  toContract: GetCrmMainContractsResponse['main_contracts'][number] | null;
  onContractChange: (value: string) => void;
  contractOptions: GetCrmMainContractsResponse['main_contracts'];
  isChangingMainContract: boolean;
  onExecute: () => void;
}

export function MemberBulkContractDialog({
  open,
  onOpenChange,
  selectedMemberIds,
  selectedMembers,
  toContract,
  onContractChange,
  contractOptions,
  isChangingMainContract,
  onExecute,
}: MemberBulkContractDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={toContract?.id ?? ''}
              onValueChange={(value) => onContractChange(value ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {contractOptions.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <AlertDialogAction disabled={!toContract || isChangingMainContract} onClick={onExecute}>
            実行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
