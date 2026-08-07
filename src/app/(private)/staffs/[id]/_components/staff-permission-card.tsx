'use client';

import Link from 'next/link';

import { formatDate } from '@/utils/format.util';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, Minus } from 'lucide-react';

import { DataTable } from '@/components/common/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { type GetCrmStaffsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  STAFF_BRAND_LABELS,
  STAFF_ROLE_LABELS,
  type StaffBrand,
  type StaffRole,
} from '../../_constants/constants';

type Staff = GetCrmStaffsByIdResponse['staff'];

interface StaffPermissionCardProps {
  staff: Staff;
}

function formatScopeTarget(target: string, storeName?: string) {
  if (target === 'all_stores') return '全店舗';
  if (target === 'specific_store') return storeName || '特定店舗';
  return target;
}

export function StaffPermissionCard({ staff }: StaffPermissionCardProps) {
  const permission = staff.permission_settings;
  const staffRole = permission.role as StaffRole;
  const billing = permission.additional_permissions.billing_correction;
  const refund = permission.additional_permissions.refund_request;
  const transfer = permission.additional_permissions.transfer_request;
  type Row = Staff['editable_scopes'][number];
  const columns: ColumnDef<Row>[] = [
    {
      header: 'ブランド',
      cell: ({ row }) => STAFF_BRAND_LABELS[row.original.brand as StaffBrand],
    },
    {
      header: '対象',
      cell: ({ row }) => formatScopeTarget(row.original.target, row.original.store_name),
    },
    {
      header: '有効開始日',
      cell: ({ row }) => formatDate(row.original.start_date),
    },
    {
      header: '有効終了日',
      cell: ({ row }) => (row.original.end_date ? formatDate(row.original.end_date) : '—'),
    },
  ];

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base">権限設定</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <div className="text-muted-foreground text-xs font-medium">編集権限</div>
            <Badge variant="secondary" className="mt-1">
              {STAFF_ROLE_LABELS[staffRole] || '-'}
            </Badge>
          </div>
          {/* TODO: Update to use the new position page */}
          <Link
            href={navigate('/positions', { id: staff.position_id })}
            className="cursor-pointer text-xs hover:underline"
          >
            本部管理者の権限を確認 →{' '}
          </Link>
          <div className="bg-muted/20 rounded-lg border p-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                {billing ? (
                  <Check className="size-4 text-green-700" />
                ) : (
                  <Minus className="text-muted-foreground size-4" />
                )}
                <span className="text-sm">確定請求訂正</span>
              </div>
              <div className="flex items-center gap-2">
                {refund ? (
                  <Check className="size-4 text-green-700" />
                ) : (
                  <Minus className="text-muted-foreground size-4" />
                )}
                <span className="text-sm">返金申請</span>
              </div>
              <div className="flex items-center gap-2">
                {transfer ? (
                  <Check className="size-4 text-green-700" />
                ) : (
                  <Minus className="text-muted-foreground size-4" />
                )}
                <span className="text-sm">移籍申請・否認</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 overflow-scroll">
            <div className="text-muted-foreground text-xs font-medium">編集可能情報</div>
            <DataTable
              variant="simple"
              columns={columns}
              data={staff.editable_scopes as Row[]}
              className="text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
