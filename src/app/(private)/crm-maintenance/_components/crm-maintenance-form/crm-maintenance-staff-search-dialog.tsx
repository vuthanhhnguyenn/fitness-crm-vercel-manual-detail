'use client';

import { useMemo, useState } from 'react';

import {
  STAFF_ROLE_DISPLAY_LABELS,
  STAFF_ROLE_ORDER,
  type StaffRole,
} from '@/app/(private)/crm-maintenance/_constants/crm-maintenance.constants';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStaffsOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { CrmMaintenanceAllowedUserFormValue } from '../../_schemas/crm-maintenance-form.schema';

const ROLE_SELECT_ITEMS = { all: '全ロール', ...STAFF_ROLE_DISPLAY_LABELS };

interface CrmMaintenanceStaffSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyAddedIds: string[];
  onAdd: (users: CrmMaintenanceAllowedUserFormValue[]) => void;
}

export function CrmMaintenanceStaffSearchDialog({
  open,
  onOpenChange,
  alreadyAddedIds,
  onAdd,
}: CrmMaintenanceStaffSearchDialogProps) {
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | StaffRole>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // The staff master exposes a single `search` param (matches staff_id / name / email); the two
  // separate ID/name inputs are narrowed server-side by whichever term is present, then AND-refined
  // client-side so both fields behave independently. Role is filtered server-side.
  const { data, isLoading } = useQuery({
    ...getCrmStaffsOptions({
      query: {
        search: searchName || searchId || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        limit: 100,
      },
    }),
    enabled: open,
  });

  const results = useMemo(() => {
    const staffs = data?.staffs ?? [];
    const idTerm = searchId.trim().toLowerCase();
    const nameTerm = searchName.trim();
    return staffs.filter(
      (staff) =>
        staff.staff_id.toLowerCase().includes(idTerm) &&
        (nameTerm === '' || staff.name.includes(nameTerm)),
    );
  }, [data, searchId, searchName]);

  const resetAndClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchId('');
      setSearchName('');
      setRoleFilter('all');
      setSelectedIds([]);
    }
    onOpenChange(nextOpen);
  };

  const handleAdd = () => {
    const toAdd: CrmMaintenanceAllowedUserFormValue[] = (data?.staffs ?? [])
      .filter(
        (staff) =>
          selectedIds.includes(staff.staff_id) && !alreadyAddedIds.includes(staff.staff_id),
      )
      .map((staff) => ({ staffId: staff.staff_id, name: staff.name, role: staff.role }));
    onAdd(toAdd);
    toast.success(`許可ユーザーに${toAdd.length}名を追加しました`);
    resetAndClose(false);
  };

  const selectableSelectedCount = selectedIds.filter((id) => !alreadyAddedIds.includes(id)).length;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>CRMユーザー検索</DialogTitle>
          <DialogDescription className="text-xs">
            メンテナンス期間中もアクセスを許可するCRMユーザーを検索して追加します
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="ユーザーID"
              className="h-8 text-xs"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
            />
            <Input
              placeholder="氏名"
              className="h-8 text-xs"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
            />
            <Select
              items={ROLE_SELECT_ITEMS}
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as 'all' | StaffRole)}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ロール</SelectItem>
                {STAFF_ROLE_ORDER.map((role) => (
                  <SelectItem key={role} value={role}>
                    {STAFF_ROLE_DISPLAY_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="rounded-md border border-dashed py-6 text-center">
              <p className="text-muted-foreground text-xs">検索中...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-md border border-dashed py-6 text-center">
              <p className="text-muted-foreground text-xs">該当するユーザーが見つかりません</p>
            </div>
          ) : (
            <div className="flex max-h-[280px] flex-col gap-1 overflow-auto">
              {results.map((staff) => {
                const added = alreadyAddedIds.includes(staff.staff_id);
                return (
                  <label
                    key={staff.staff_id}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                      added ? 'opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <Checkbox
                      className="size-4"
                      disabled={added}
                      checked={added || selectedIds.includes(staff.staff_id)}
                      onCheckedChange={(checked) =>
                        setSelectedIds((prev) =>
                          checked === true
                            ? [...prev, staff.staff_id]
                            : prev.filter((id) => id !== staff.staff_id),
                        )
                      }
                    />
                    <span className="text-muted-foreground w-[80px] text-xs">{staff.staff_id}</span>
                    <span className="flex-1 text-sm">{staff.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {STAFF_ROLE_DISPLAY_LABELS[staff.role]}
                    </Badge>
                    {added && (
                      <span className="text-muted-foreground shrink-0 text-[10px]">追加済み</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => resetAndClose(false)}>
            キャンセル
          </Button>
          <Button disabled={selectableSelectedCount === 0} onClick={handleAdd}>
            選択したユーザーを追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
