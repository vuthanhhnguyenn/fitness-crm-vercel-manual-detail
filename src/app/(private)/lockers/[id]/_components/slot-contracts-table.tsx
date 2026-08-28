'use client';

import { useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { formatDateYYYYMMDD } from '@/utils/date.util';
import { Download, Unlock } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { GetCrmLockersByIdResponse, LockerOptionMasterRef } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  LOCKER_CONTRACT_STATUS_BADGE_CLASSES,
  LOCKER_CONTRACT_STATUS_LABELS,
} from '../../_constants/constants';
import { PasswordCell } from './password-cell';

type LockerSlot = NonNullable<GetCrmLockersByIdResponse>['locker']['slot_items'][number];

interface SlotContractsTableProps {
  /** FR-013: the cabinet's fee options — standard row and bottom row (may be one when equal). */
  feeOptions: LockerOptionMasterRef[];
  pendingSlots: LockerSlot[];
  displayedSlots: LockerSlot[];
  pendingOnly: boolean;
  onExportCsv: () => void;
  isExportingCsv?: boolean;
  onPendingOnlyChange: (value: boolean) => void;
  checkedSlots: Set<string>;
  onToggleCheck: (slotId: string) => void;
  onBulkRelease: () => void;
  onSingleRelease: (slotNumber: string) => void;
  onSelectSlot: (slotId: string) => void;
  onContractTypeChange: (slotId: string, code: string) => void;
  isUpdatingSlot: boolean;
}

export function SlotContractsTable({
  feeOptions,
  pendingSlots,
  displayedSlots,
  pendingOnly,
  onExportCsv,
  isExportingCsv = false,
  onPendingOnlyChange,
  checkedSlots,
  onToggleCheck,
  onBulkRelease,
  onSingleRelease,
  onSelectSlot,
  onContractTypeChange,
  isUpdatingSlot,
}: SlotContractsTableProps) {
  const { hasPermission } = useAuthUser();
  const canEditSlot = hasPermission(Permission.LockersEdit);
  // Contract type is displayed statically; "変更" switches to inline edit mode (same pattern as the lock type in the Sheet). Prevents accidental changes while browsing.
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [draftContractCode, setDraftContractCode] = useState('');

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">契約・割当一覧</h3>
          {pendingSlots.length > 0 ? (
            <Badge
              variant="outline"
              className="bg-warning/10 text-warning border-warning/20 text-xs"
            >
              開放待ち {pendingSlots.length}件
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="pending-only" className="flex cursor-pointer items-center gap-2 text-xs">
            <Checkbox
              id="pending-only"
              className="size-4"
              checked={pendingOnly}
              onCheckedChange={(value) => onPendingOnlyChange(Boolean(value))}
            />
            開放待ちのみ表示
          </label>
          <RoleGatedButton
            requiredPermission={Permission.LockersExport}
            denyTooltip="CSV出力の権限がありません"
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={onExportCsv}
            disabled={isExportingCsv}
          >
            <Download className="size-3" />
            CSV出力
          </RoleGatedButton>
          <RoleGatedButton
            requiredPermission={Permission.LockersEdit}
            denyTooltip="清掃・開放操作の権限がありません"
            tooltip={
              checkedSlots.size === 0
                ? 'スロットが未選択のため一括開放できません。開放待ちの行のチェックボックスで対象を選択してください'
                : undefined
            }
            size="sm"
            className="gap-1 text-xs"
            disabled={checkedSlots.size === 0}
            onClick={onBulkRelease}
          >
            <Unlock className="size-3" />
            一括開放
            {checkedSlots.size > 0 ? (
              <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                {checkedSlots.size}
              </Badge>
            ) : null}
          </RoleGatedButton>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10 text-xs font-semibold" />
            <TableHead className="text-xs font-semibold">スロット番号</TableHead>
            <TableHead className="text-xs font-semibold">ステータス</TableHead>
            <TableHead className="text-xs font-semibold">契約者</TableHead>
            <TableHead className="text-xs font-semibold">会員ID</TableHead>
            <TableHead className="text-xs font-semibold">オプション契約</TableHead>
            <TableHead className="text-xs font-semibold">契約種類</TableHead>
            <TableHead className="text-xs font-semibold">解約日</TableHead>
            <TableHead className="text-xs font-semibold">パスワード</TableHead>
            <TableHead className="w-20 text-xs font-semibold">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedSlots.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={10} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-muted-foreground text-sm">
                    {pendingOnly
                      ? '開放待ちのスロットはありません。'
                      : '対象のスロットがありません。'}
                  </p>
                  {pendingOnly ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onPendingOnlyChange(false)}
                    >
                      条件をクリア
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ) : null}
          {displayedSlots.map((slot) => {
            const isPending = slot.status === 'pending_release';
            const contractType = slot.contract_type;

            return (
              <TableRow
                key={slot.id}
                className="hover:bg-accent/50 cursor-pointer"
                onClick={() => onSelectSlot(slot.id)}
              >
                <TableCell onClick={(event) => event.stopPropagation()}>
                  {isPending && canEditSlot ? (
                    <Checkbox
                      className="size-4"
                      checked={checkedSlots.has(slot.id)}
                      onCheckedChange={() => onToggleCheck(slot.id)}
                    />
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{slot.slot_number}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${LOCKER_CONTRACT_STATUS_BADGE_CLASSES[slot.status]}`}
                  >
                    {LOCKER_CONTRACT_STATUS_LABELS[slot.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {slot.member_name ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {slot.member_id ?? '—'}
                </TableCell>
                <TableCell>
                  {slot.option_contract_name ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {slot.option_contract_name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  {!slot.is_bottom_row ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : editingSlotId === slot.id ? (
                    <div className="flex items-center gap-1">
                      <Select
                        value={draftContractCode}
                        onValueChange={(code) => code && setDraftContractCode(code)}
                      >
                        <SelectTrigger className="h-7 w-44 text-xs">
                          <SelectValue placeholder="契約種類を選択...">
                            {feeOptions.find((item) => item.code === draftContractCode)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {feeOptions.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              <span className="flex items-center gap-2">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground text-[10px]">
                                  ¥{item.price_including_tax.toLocaleString()}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setEditingSlotId(null)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={!draftContractCode || isUpdatingSlot}
                        onClick={() => {
                          onContractTypeChange(slot.id, draftContractCode);
                          setEditingSlotId(null);
                        }}
                      >
                        保存
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {contractType ? (
                        <>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {contractType.name}
                          </Badge>
                          <span className="text-muted-foreground text-[10px]">
                            ¥{contractType.price_including_tax.toLocaleString()}/月
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">未割当</span>
                      )}
                      <RoleGatedButton
                        requiredPermission={Permission.LockersContractsEdit}
                        denyTooltip="スロット契約・割当の権限がありません"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setDraftContractCode(slot.contract_type_code ?? '');
                          setEditingSlotId(slot.id);
                        }}
                      >
                        {contractType ? '変更' : '割り当て'}
                      </RoleGatedButton>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {slot.cancel_date ? (
                    <span className="text-warning">{formatDateYYYYMMDD(slot.cancel_date)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <PasswordCell password={slot.password} />
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  {isPending && canEditSlot ? (
                    <RoleGatedButton
                      requiredPermission={Permission.LockersEdit}
                      denyTooltip="開放操作の権限がありません"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => onSingleRelease(slot.slot_number)}
                    >
                      <Unlock className="size-3" />
                      開放
                    </RoleGatedButton>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">
          {pendingOnly ? `開放待ち ${pendingSlots.length}件` : `全${displayedSlots.length}件`}
        </p>
      </div>
    </Card>
  );
}
