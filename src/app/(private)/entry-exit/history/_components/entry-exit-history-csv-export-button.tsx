'use client';

import { Download } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';

import type { PostCrmEntryExitLogsExportData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { useEntryExitHistoryCsvExport } from '../_hooks/use-entry-exit-history-csv-export.hook';

interface EntryExitHistoryCsvExportButtonProps {
  exportQueryParams: NonNullable<PostCrmEntryExitLogsExportData['body']>;
}

/** FR-013/FR-014: exports the currently filtered history using the applied search/filter conditions. */
export function EntryExitHistoryCsvExportButton({
  exportQueryParams,
}: EntryExitHistoryCsvExportButtonProps) {
  const { mutate: exportCsv, isPending } = useEntryExitHistoryCsvExport();

  return (
    <RoleGatedButton
      variant="outline"
      size="sm"
      className="gap-1"
      requiredPermission={Permission.EntryExitHistoryExport}
      denyTooltip="入退館ログCSV出力の権限がありません"
      onClick={() => exportCsv(exportQueryParams)}
      disabled={isPending}
    >
      <Download className="size-4" />
      CSV出力
    </RoleGatedButton>
  );
}
