import { STAFF_ROLE_DISPLAY_LABELS } from '@/app/(private)/crm-maintenance/_constants/crm-maintenance.constants';
import { formatDatetimeISO } from '@/utils/format.util';

import { Field } from '@/components/common/field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { CrmMaintenanceDetailResponse } from '@/lib/api/types.gen';

interface CrmMaintenanceDetailInfoCardsProps {
  maintenance: CrmMaintenanceDetailResponse;
}

export function CrmMaintenanceDetailInfoCards({ maintenance }: CrmMaintenanceDetailInfoCardsProps) {
  return (
    <div className="flex w-[60%] flex-col gap-4">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field label="ID" value={maintenance.id} />
            <Field
              label="タイトル"
              value={<span className="font-medium">{maintenance.title}</span>}
            />
            <Field label="開始日時" value={formatDatetimeISO(maintenance.startsAt)} />
            <Field label="終了日時" value={formatDatetimeISO(maintenance.endsAt)} />
          </div>
        </CardContent>
      </Card>

      {/* メンテナンスメッセージ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">メンテナンスメッセージ</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{maintenance.message}</p>
        </CardContent>
      </Card>

      {/* 備考 (only when present) */}
      {maintenance.note && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">備考</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{maintenance.note}</p>
          </CardContent>
        </Card>
      )}

      {/* 許可ユーザー */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base font-semibold">
            許可ユーザー（{maintenance.allowedUsers.length}名）
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px] text-xs font-semibold">ユーザーID</TableHead>
              <TableHead className="min-w-[160px] text-xs font-semibold">氏名</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold">ロール</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenance.allowedUsers.map((user) => (
              <TableRow key={user.staffId}>
                <TableCell className="text-muted-foreground text-xs">{user.staffId}</TableCell>
                <TableCell className="text-sm">{user.name}</TableCell>
                <TableCell className="text-xs">{STAFF_ROLE_DISPLAY_LABELS[user.role]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
