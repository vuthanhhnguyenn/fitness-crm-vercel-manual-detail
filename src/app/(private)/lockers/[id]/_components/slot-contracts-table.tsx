'use client';

import { useAuthUser } from '@/contexts/auth-user.context';
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

import type { GetCrmLockersByIdResponse, OptionMasterListItem } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  LOCKER_CONTRACT_STATUS_BADGE_CLASSES,
  LOCKER_CONTRACT_STATUS_LABELS,
} from '../../_constants/constants';
import { PasswordCell } from './password-cell';

type LockerSlot = NonNullable<GetCrmLockersByIdResponse>['locker']['slot_items'][number];

interface SlotContractsTableProps {
  lockerOptionMasters: OptionMasterListItem[];
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
  lockerOptionMasters,
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
  const canAssignContract = hasPermission(Permission.LockersContractsEdit);
  const canExportCsv = hasPermission(Permission.LockersExport);

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
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={onExportCsv}
            disabled={isExportingCsv || !canExportCsv}
          >
            <Download className="size-3" />
            CSV出力
          </Button>
          {canEditSlot ? (
            <Button
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
            </Button>
          ) : null}
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
            <TableHead className="text-xs font-semibold">G-02契約種類</TableHead>
            <TableHead className="text-xs font-semibold">開放待ち日</TableHead>
            <TableHead className="text-xs font-semibold">パスワード</TableHead>
            <TableHead className="w-20 text-xs font-semibold">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedSlots.map((slot) => {
            const isPending = slot.status === 'pending_release';
            const contractType = lockerOptionMasters.find(
              (item) => item.code === slot.contract_type_code,
            );

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
                  {slot.is_bottom_row && canAssignContract ? (
                    <Select
                      value={slot.contract_type_code ?? ''}
                      onValueChange={(code) => code && onContractTypeChange(slot.id, code)}
                      disabled={isUpdatingSlot}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue placeholder="未割当">
                          {contractType?.name ?? '未割当'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {lockerOptionMasters.map((item) => (
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
                  ) : slot.is_bottom_row ? (
                    <span className="text-muted-foreground text-xs">
                      {contractType?.name ?? '未割当'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {slot.cancel_date ? (
                    <span className="text-warning">{slot.cancel_date}</span>
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
