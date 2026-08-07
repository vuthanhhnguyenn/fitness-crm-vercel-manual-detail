'use client';

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import { downloadCsv, getCsvFilenameFromContentDisposition } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';

import { TrainingEquipment } from '@/lib/api';
import type { PostCrmTrainingEquipmentExportData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT } from '../_constants/training-equipment.constants';

type SortOrder = 'asc' | 'desc';
type CsvDownload = { blob: Blob; filename: string };

function asSortOrder(value: string | null, fallback: SortOrder): SortOrder {
  return value === 'asc' || value === 'desc' ? value : fallback;
}

function TrainingEquipmentCsvExportButtonContent() {
  const searchParams = useSearchParams();
  const { mutate, isPending } = useMutation({
    mutationFn: async (): Promise<CsvDownload> => {
      const body: NonNullable<PostCrmTrainingEquipmentExportData['body']> = {
        keyword: searchParams.get('te_keyword') || undefined,
        tool_type:
          (searchParams.get('te_tool_type') as NonNullable<
            PostCrmTrainingEquipmentExportData['body']
          >['tool_type']) || undefined,
        status:
          (searchParams.get('te_status') as NonNullable<
            PostCrmTrainingEquipmentExportData['body']
          >['status']) || TRAINING_EQUIPMENT_STATUS_FILTER_DEFAULT,
        sort_by:
          (searchParams.get('te_sort_by') as NonNullable<
            PostCrmTrainingEquipmentExportData['body']
          >['sort_by']) || undefined,
        sort_order: asSortOrder(searchParams.get('te_sort_order'), 'asc'),
      };

      const { data, response } = await TrainingEquipment.postCrmTrainingEquipmentExport({
        body,
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
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });

  return (
    <RoleGatedButton
      requiredPermission={Permission.TrainingEquipmentExport}
      variant="outline"
      className="gap-1"
      denyTooltip="CSV出力の権限がありません"
      disabled={isPending}
      onClick={() => mutate()}
    >
      <Download className="size-4" />
      CSV出力
    </RoleGatedButton>
  );
}

export function TrainingEquipmentCsvExportButton() {
  return (
    <Suspense
      fallback={
        <RoleGatedButton
          requiredPermission={Permission.TrainingEquipmentExport}
          variant="outline"
          className="gap-1"
          disabled
        >
          <Download className="size-4" />
          CSV出力
        </RoleGatedButton>
      }
    >
      <TrainingEquipmentCsvExportButtonContent />
    </Suspense>
  );
}
