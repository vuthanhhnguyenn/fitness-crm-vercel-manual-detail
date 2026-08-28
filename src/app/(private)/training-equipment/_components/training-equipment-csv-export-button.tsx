'use client';

import { downloadCsv, getCsvFilenameFromContentDisposition } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';

import { TrainingEquipmentManagement } from '@/lib/api';
import type { GetCrmTrainingEquipmentExportData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type ExportQuery = NonNullable<GetCrmTrainingEquipmentExportData['query']>;
type CsvDownload = { blob: Blob; filename: string };

type TrainingEquipmentCsvExportButtonProps = {
  /**
   * FR-010: same filters and ordering as the list, without pagination. Takes what the list's
   * filter hook already built, so the URL is never parsed twice.
   */
  query: ExportQuery;
  /** Blocks the export while the store scope is unsettled (the API returns 400 without `storeId`). */
  disabled?: boolean;
};

export function TrainingEquipmentCsvExportButton({
  query,
  disabled = false,
}: TrainingEquipmentCsvExportButtonProps) {
  const { mutate, isPending } = useMutation({
    mutationFn: async (): Promise<CsvDownload> => {
      const { data, response } = await TrainingEquipmentManagement.getCrmTrainingEquipmentExport({
        query,
        parseAs: 'blob',
        throwOnError: true,
      });

      return {
        blob: data as Blob,
        filename: getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'training_equipment.csv',
        ),
      };
    },
    onSuccess: ({ blob, filename }) => {
      downloadCsv(blob, filename);
      toast.success('機材台帳のCSVをダウンロードしました');
    },
  });

  return (
    <RoleGatedButton
      requiredPermission={Permission.TrainingEquipmentExport}
      variant="outline"
      className="gap-1"
      denyTooltip="CSV出力の権限がありません"
      disabled={disabled || isPending}
      onClick={() => mutate()}
    >
      <Download className="size-4" />
      CSV出力
    </RoleGatedButton>
  );
}
