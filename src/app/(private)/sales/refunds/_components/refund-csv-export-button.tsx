'use client';

import { useRef } from 'react';

import { downloadCsv, getCsvFilenameFromContentDisposition } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';

import { Billing } from '@/lib/api';
import type { PostCrmBillingRecordsRefundRequestsExportData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type ExportBody = NonNullable<PostCrmBillingRecordsRefundRequestsExportData['body']>;

interface RefundCsvExportButtonProps {
  filters: ExportBody;
}

/**
 * FR-020: refund CSV export — HQ/Manager/System only. The server always excludes
 * SBPS-settled refunds and non-completed entries regardless of the filters sent here.
 */
export function RefundCsvExportButton({ filters }: Readonly<RefundCsvExportButtonProps>) {
  const submittingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, response } = await Billing.postCrmBillingRecordsRefundRequestsExport({
        body: filters,
        parseAs: 'blob',
        throwOnError: true,
      });
      downloadCsv(
        data as Blob,
        getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'refund-export.csv',
        ),
      );
    },
    onSuccess: () => {
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  return (
    <RoleGatedButton
      requiredPermission={Permission.SalesRefundExport}
      denyTooltip="返金CSV出力の権限がありません"
      tooltip="SBPS以外の返金済みデータのみ対象"
      variant="outline"
      className="gap-1"
      disabled={mutation.isPending}
      onClick={() => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        mutation.mutate();
      }}
    >
      <Download className="size-4" />
      返金CSV出力
    </RoleGatedButton>
  );
}
