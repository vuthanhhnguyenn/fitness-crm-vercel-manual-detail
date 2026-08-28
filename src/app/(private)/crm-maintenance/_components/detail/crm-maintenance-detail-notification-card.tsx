'use client';

import { BellRing, CheckCircle2 } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Permission } from '@/types/permission.type';

interface CrmMaintenanceDetailNotificationCardProps {
  notified: boolean;
  onSend: () => void;
}

export function CrmMaintenanceDetailNotificationCard({
  notified,
  onSend,
}: CrmMaintenanceDetailNotificationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">事前通知</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        {notified ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-success size-4 shrink-0" />
            <p className="text-sm">通知済み</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            対象CRMユーザーにメンテナンス予定を通知します。
          </p>
        )}
        {/* 送信済みでも手動で再送信できるよう、ボタンは常に表示する。 */}
        <RoleGatedButton
          requiredPermission={Permission.CrmMaintenanceNotify}
          denyTooltip="通知の送信は System 権限のみ可能です"
          variant="outline"
          size="sm"
          fullWidth
          className="gap-1"
          onClick={onSend}
        >
          <BellRing className="size-4" />
          {notified ? '通知を再送信' : '通知を送信'}
        </RoleGatedButton>
      </CardContent>
    </Card>
  );
}
