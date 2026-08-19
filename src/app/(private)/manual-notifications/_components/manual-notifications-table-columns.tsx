import type { ColumnDef } from '@tanstack/react-table';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';

import {
  MANUAL_NOTIFICATION_BRAND_LABELS,
  MANUAL_NOTIFICATION_CHANNEL_LABELS,
  MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS,
  MANUAL_NOTIFICATION_TARGET_LABELS,
  type ManualNotificationRow,
  getManualNotificationDynamicAttributeLabel,
  getManualNotificationStatusClass,
  getManualNotificationStatusLabel,
} from '../_constants/manual-notification.constants';
import { ManualNotificationRowActions } from './manual-notification-row-actions';

const CHANNEL_ICONS = {
  sms: MessageSquare,
  push: Bell,
  email: Mail,
  in_app: Smartphone,
} as const;

function targetDetail(row: ManualNotificationRow): string {
  switch (row.target.type) {
    case 'all_members':
      return '全会員対象';
    case 'brands':
      return (
        row.target.brands.map((brand) => MANUAL_NOTIFICATION_BRAND_LABELS[brand]).join(' · ') ||
        '配信対象未設定'
      );
    case 'stores':
      return row.target.stores.map((store) => store.name).join(' · ') || '配信対象未設定';
    case 'contract_type':
      return MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS[row.target.contractType];
    case 'membership_duration':
      return row.target.condition === 'within'
        ? `入会後${row.target.months}ヶ月以内`
        : `入会後${row.target.months}ヶ月以上`;
    case 'dynamic_attribute':
      return getManualNotificationDynamicAttributeLabel(row.target.attribute);
    case 'members':
      return row.target.members.length > 0
        ? `${row.target.members.length}名を指定`
        : '配信対象未設定';
  }
}

function targetBadgeClass(type: ManualNotificationRow['target']['type']): string {
  if (type === 'all_members') return 'border-transparent bg-neutral-900 text-white';
  if (type === 'brands') return 'border-transparent bg-neutral-100 text-foreground';
  return 'bg-white text-foreground';
}

export function getManualNotificationsTableColumns(): ColumnDef<ManualNotificationRow>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="通知ID" className="[&_svg]:size-3" />
      ),
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      meta: { className: 'w-[80px] min-w-[80px]' },
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="タイトル（管理用）"
          className="[&_svg]:size-3"
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.title || '無題の下書き'}</span>
      ),
      meta: { className: 'min-w-[180px]' },
    },
    {
      id: 'target',
      accessorFn: (row) => targetDetail(row),
      header: '配信対象',
      cell: ({ row }) => (
        <div className="flex min-w-[120px] flex-col gap-0.5">
          <Badge
            variant="outline"
            className={`w-fit text-[10px] ${targetBadgeClass(row.original.target.type)}`}
          >
            {MANUAL_NOTIFICATION_TARGET_LABELS[row.original.target.type]}
          </Badge>
          <span className="text-muted-foreground text-[10px]">{targetDetail(row.original)}</span>
        </div>
      ),
      meta: { className: 'w-[120px] min-w-[120px]' },
      enableSorting: false,
    },
    {
      id: 'channels',
      header: 'チャネル',
      cell: ({ row }) => (
        <div className="flex min-w-[280px] flex-nowrap gap-1 whitespace-nowrap">
          {row.original.channels.length > 0 ? (
            row.original.channels.map((channel) => {
              const Icon = CHANNEL_ICONS[channel];
              return (
                <Badge
                  key={channel}
                  variant="outline"
                  className="shrink-0 gap-1 text-[9px] font-normal whitespace-nowrap"
                >
                  <Icon className="size-2.5" />
                  {MANUAL_NOTIFICATION_CHANNEL_LABELS[channel]}
                </Badge>
              );
            })
          ) : (
            <span className="text-muted-foreground text-xs">未設定</span>
          )}
        </div>
      ),
      meta: { className: 'w-[280px] min-w-[280px]' },
      enableSorting: false,
    },
    {
      accessorKey: 'targetCount',
      header: '対象件数',
      cell: ({ row }) => (
        <span className="text-xs">{row.original.targetCount.toLocaleString('ja-JP')}名</span>
      ),
      meta: { className: 'w-[80px] min-w-[60px] text-right' },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ステータス" className="[&_svg]:size-3" />
      ),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${getManualNotificationStatusClass(row.original.status)}`}
        >
          {getManualNotificationStatusLabel(row.original.status)}
        </Badge>
      ),
      meta: { className: 'w-[90px] min-w-[90px]' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ManualNotificationRowActions row={row.original} />,
      meta: { className: 'w-[44px] min-w-[44px] text-center' },
      enableSorting: false,
    },
  ];
}
