'use client';

import { useRef } from 'react';

import { downloadCsv, getCsvFilenameFromContentDisposition } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';

import { Billing } from '@/lib/api';
import type { PostCrmBillingRecordsTransactionsExportData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type TransactionLedgerFilters = NonNullable<PostCrmBillingRecordsTransactionsExportData['body']>;

interface TransactionsCsvExportButtonProps {
  filters: TransactionLedgerFilters;
  total: number;
  filterSummary: string[];
}

export function TransactionsCsvExportButton({
  filters,
  total,
  filterSummary,
}: Readonly<TransactionsCsvExportButtonProps>) {
  const submittingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, response } = await Billing.postCrmBillingRecordsTransactionsExport({
        body: filters,
        parseAs: 'blob',
        throwOnError: true,
      });
      downloadCsv(
        data as Blob,
        getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'transactions-export.csv',
        ),
      );
    },
    onSuccess: () => {
      const description =
        filterSummary.length > 0
          ? `検索条件（${filterSummary.join('、')}）を保持したまま ${total} 件を出力しました。`
          : `全 ${total} 件を出力しました。`;
      toast.success('入出金明細CSVをダウンロードしました', { description });
    },
    onError: () => {
      toast.error('CSVのダウンロードに失敗しました');
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  return (
    <RoleGatedButton
      requiredPermission={Permission.SalesTransactionsView}
      denyTooltip="CSV出力の権限がありません"
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
      CSV出力
    </RoleGatedButton>
  );
}
