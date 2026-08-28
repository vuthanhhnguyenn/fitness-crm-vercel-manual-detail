'use client';

import { useState } from 'react';

import { STAFF_ROLE_DISPLAY_LABELS } from '@/app/(private)/crm-maintenance/_constants/crm-maintenance.constants';
import { AlertTriangle, Search, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { CrmMaintenanceAllowedUserFormValue } from '../../_schemas/crm-maintenance-form.schema';
import { CrmMaintenanceStaffSearchDialog } from './crm-maintenance-staff-search-dialog';

interface CrmMaintenanceAllowedUserListProps {
  value: CrmMaintenanceAllowedUserFormValue[];
  onChange: (next: CrmMaintenanceAllowedUserFormValue[]) => void;
}

export function CrmMaintenanceAllowedUserList({
  value,
  onChange,
}: CrmMaintenanceAllowedUserListProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleAdd = (users: CrmMaintenanceAllowedUserFormValue[]) => {
    const existingIds = new Set(value.map((user) => user.staffId));
    const merged = [...value, ...users.filter((user) => !existingIds.has(user.staffId))];
    onChange(merged);
  };

  const handleRemove = (staffId: string) => {
    onChange(value.filter((user) => user.staffId !== staffId));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">
        メンテナンス期間中もCRM管理画面にアクセスできるユーザー（開発関係者・動作検証担当者等）を設定します
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1"
        onClick={() => setIsSearchOpen(true)}
      >
        <Search className="size-4" />
        CRMユーザーを検索して追加
      </Button>

      {value.length === 0 ? (
        <div className="rounded-md border border-dashed py-6 text-center">
          <p className="text-muted-foreground text-xs">許可ユーザーはまだ追加されていません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {value.map((user) => (
            <div key={user.staffId} className="flex items-center gap-3 rounded-md border px-3 py-2">
              <span className="text-muted-foreground w-[80px] text-xs">{user.staffId}</span>
              <span className="flex-1 text-sm">{user.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {STAFF_ROLE_DISPLAY_LABELS[user.role]}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() => handleRemove(user.staffId)}
                aria-label={`${user.name}を削除`}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Alert className="border-warning/50 bg-warning/15">
        <AlertTriangle className="text-warning size-4" />
        <AlertDescription className="text-muted-foreground text-xs">
          メンテナンス期間中、許可ユーザー以外はCRM管理画面にアクセスできなくなります。開発関係者・検証担当者を事前に登録してください。
        </AlertDescription>
      </Alert>

      <CrmMaintenanceStaffSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        alreadyAddedIds={value.map((user) => user.staffId)}
        onAdd={handleAdd}
      />
    </div>
  );
}
