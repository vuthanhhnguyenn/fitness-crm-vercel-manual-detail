'use client';

import { useAuthUser } from '@/contexts/auth-user.context';
import { downloadCsv } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Billing } from '@/lib/api';
import type { BillingLineItem } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type BillingDocumentType = 'invoice' | 'receipt';

const BILLING_DOCUMENT_LABELS: Record<
  BillingDocumentType,
  { filenamePrefix: string; successMessage: string; errorMessage: string }
> = {
  invoice: {
    filenamePrefix: 'invoice',
    successMessage: '請求書をダウンロードしました',
    errorMessage: '請求書のダウンロードに失敗しました',
  },
  receipt: {
    filenamePrefix: 'receipt',
    successMessage: '領収書をダウンロードしました',
    errorMessage: '領収書のダウンロードに失敗しました',
  },
};

interface BillingDocumentExportMenuProps {
  billingRecordId: string;
  lineItems: BillingLineItem[];
}

export function BillingDocumentExportMenu({
  billingRecordId,
  lineItems,
}: Readonly<BillingDocumentExportMenuProps>) {
  const { hasPermission } = useAuthUser();
  const hasUnconfirmedLine = lineItems.some((item) => item.payment_status !== 'confirmed');

  const documentMutation = useMutation({
    mutationFn: async (docType: BillingDocumentType) => {
      const { data } = await Billing.getCrmBillingRecordsByIdInvoice({
        path: { id: billingRecordId },
        parseAs: 'blob',
        throwOnError: true,
      });
      return { blob: data as Blob, docType };
    },
    onSuccess: ({ blob, docType }) => {
      const { filenamePrefix, successMessage } = BILLING_DOCUMENT_LABELS[docType];
      downloadCsv(blob, `${filenamePrefix}-${billingRecordId}.pdf`);
      toast.success(successMessage);
    },
    onError: (_error, docType) => {
      toast.error(BILLING_DOCUMENT_LABELS[docType].errorMessage);
    },
  });

  if (!hasPermission(Permission.SalesExport)) {
    return (
      <RoleGatedButton
        requiredPermission={Permission.SalesExport}
        denyTooltip="帳票出力の権限がありません"
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
      >
        <Download className="size-4" />
        帳票
      </RoleGatedButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border px-3 text-xs font-medium">
        <Download className="size-4" />
        帳票
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-70">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<span className="block" />}>
              <DropdownMenuItem
                disabled={documentMutation.isPending || hasUnconfirmedLine}
                onClick={() => documentMutation.mutate('receipt')}
              >
                <Download className="mr-2 size-4" />
                領収書をダウンロード（PDF）
              </DropdownMenuItem>
            </TooltipTrigger>
            {hasUnconfirmedLine && (
              <TooltipContent side="left">
                <p className="text-xs">入金確認済みの明細のみ発行できます</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuItem
          disabled={documentMutation.isPending}
          onClick={() => documentMutation.mutate('invoice')}
        >
          <Download className="mr-2 size-4" />
          請求書をダウンロード（PDF）
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="text-muted-foreground px-2 py-1 text-xs">
          ※ 入金確認済みのみ発行可。出力期間12ヶ月以内
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
