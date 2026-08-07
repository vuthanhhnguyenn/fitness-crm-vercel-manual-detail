import type { ColumnDef } from '@tanstack/react-table';

import { BrandBadge } from '@/components/common/brand-badge';
import { Badge } from '@/components/ui/badge';

import type { GetCrmSurveysResponsesResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  SURVEY_RESPONSE_MEMBER_TYPE_LABELS,
  SURVEY_RESPONSE_STATUS_BADGE_CLASSES,
  SURVEY_RESPONSE_STATUS_LABELS,
  SURVEY_TYPE_LABELS,
  formatSurveyDateOnly,
} from '../../_constants/constants';

type SurveyResponseRow = GetCrmSurveysResponsesResponse['responses'][number];

export function SurveyResponsesTableColumns(): ColumnDef<SurveyResponseRow>[] {
  return [
    {
      accessorKey: 'response_date',
      enableSorting: false,
      header: '回答日',
      meta: { className: 'w-[132px]' },
      cell: ({ row }) => (
        <span className="text-xs">{formatSurveyDateOnly(row.original.response_date)}</span>
      ),
    },
    {
      accessorKey: 'member_number',
      enableSorting: false,
      header: '会員番号',
      meta: { className: 'w-[100px]' },
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.member_number}
        </span>
      ),
    },
    {
      accessorKey: 'member_name',
      enableSorting: false,
      header: '会員名',
      meta: { className: 'min-w-[150px]' },
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.member_name}</span>,
    },
    {
      accessorKey: 'survey_name',
      enableSorting: false,
      header: 'アンケート名',
      meta: { className: 'min-w-[220px]' },
      cell: ({ row }) => <span className="text-xs">{row.original.survey_name}</span>,
    },
    {
      accessorKey: 'template_type',
      enableSorting: false,
      header: '種別',
      meta: { className: 'w-[112px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-normal',
            row.original.template_type === 'lifecycle'
              ? 'bg-info/15 text-info border-info/20'
              : 'bg-muted text-muted-foreground border-border',
          )}
        >
          {SURVEY_TYPE_LABELS[row.original.template_type]}
        </Badge>
      ),
    },
    {
      accessorKey: 'brand',
      enableSorting: false,
      header: 'ブランド',
      meta: { className: 'w-[104px]' },
      cell: ({ row }) => <BrandBadge brand={row.original.brand} />,
    },
    {
      accessorKey: 'store_name',
      enableSorting: false,
      header: '店舗',
      meta: { className: 'min-w-[140px]' },
      cell: ({ row }) => <span className="text-xs">{row.original.store_name}</span>,
    },
    {
      accessorKey: 'member_type',
      enableSorting: false,
      header: '区分',
      meta: { className: 'w-[132px]' },
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-normal">
          {SURVEY_RESPONSE_MEMBER_TYPE_LABELS[row.original.member_type]}
        </Badge>
      ),
    },
    {
      accessorKey: 'answered_count',
      enableSorting: false,
      header: '回答数',
      meta: { className: 'w-[88px] text-right' },
      cell: ({ row }) => (
        <span className="inline-block w-full text-right text-xs">
          {row.original.answered_count}/{row.original.total_count}問
        </span>
      ),
    },
    {
      accessorKey: 'status',
      enableSorting: false,
      header: '状態',
      meta: { className: 'w-[84px]' },
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-normal',
            SURVEY_RESPONSE_STATUS_BADGE_CLASSES[row.original.status],
          )}
        >
          {SURVEY_RESPONSE_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
  ];
}
