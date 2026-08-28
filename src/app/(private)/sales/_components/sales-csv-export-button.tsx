'use client';

import { Suspense, useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { downloadCsv, getCsvFilenameFromContentDisposition } from '@/utils/csv.util';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

import { Billing } from '@/lib/api';
import { getCrmBillingRecordsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { PostCrmBillingRecordsExportData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type EntryType = NonNullable<PostCrmBillingRecordsExportData['body']>['entry_type'];
type OutputMode = 'individual' | 'batch';

interface JournalTypeState {
  sales: boolean;
  payment: boolean;
  refund: boolean;
  expense: boolean;
  badDebt: boolean;
}

const JOURNAL_TYPE_ITEMS: {
  key: keyof JournalTypeState;
  entryType: EntryType;
  label: string;
}[] = [
  { key: 'sales', entryType: 'sales', label: '売上' },
  { key: 'payment', entryType: 'payment', label: '入金' },
  { key: 'refund', entryType: 'refund', label: '返金（売上訂正）' },
  { key: 'expense', entryType: 'expense', label: '支払' },
  { key: 'badDebt', entryType: 'bad_debt', label: '貸倒' },
];

interface SalesCsvExportButtonProps {
  billingMonth: string;
  storeId?: string;
}

function formatBillingMonthLabel(billingMonth: string): string {
  const [year, month] = billingMonth.split('-');
  if (!year || !month) return billingMonth;
  return `${year}年${Number(month)}月分`;
}

function SalesCsvExportButtonContent({
  billingMonth,
  storeId,
}: Readonly<SalesCsvExportButtonProps>) {
  const { hasPermission } = useAuthUser();
  const canExport = hasPermission(Permission.SalesExport);
  const [open, setOpen] = useState(false);
  const [journalTypes, setJournalTypes] = useState<JournalTypeState>({
    sales: true,
    payment: true,
    refund: true,
    expense: true,
    badDebt: true,
  });
  const [outputMode, setOutputMode] = useState<OutputMode>('individual');

  const selectedEntryTypes = JOURNAL_TYPE_ITEMS.filter((item) => journalTypes[item.key]).map(
    (item) => item.entryType,
  );

  const { data: summary } = useQuery(
    getCrmBillingRecordsSummaryOptions({
      query: { billing_month: billingMonth, store_id: storeId },
    }),
  );
  const unconfirmedCount = summary?.unconfirmed_count ?? 0;

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const exportEntryType = async (entryType: EntryType) => {
        const { data, response } = await Billing.postCrmBillingRecordsExport({
          body: {
            billing_month: billingMonth,
            store_id: storeId,
            entry_type: entryType,
          },
          parseAs: 'blob',
          throwOnError: true,
        });
        downloadCsv(
          data as Blob,
          getCsvFilenameFromContentDisposition(
            response.headers.get('content-disposition'),
            `billing-export-${entryType}.csv`,
          ),
        );
      };

      if (outputMode === 'batch') {
        await exportEntryType('all');
        return;
      }
      for (const entryType of selectedEntryTypes) {
        await exportEntryType(entryType);
      }
    },
    onSuccess: () => {
      toast.success('CSVを出力しました');
      setOpen(false);
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });

  if (!canExport) {
    return (
      <RoleGatedButton
        requiredPermission={Permission.SalesExport}
        variant="outline"
        className="gap-1"
        denyTooltip="会計CSVを出力する権限がありません"
      >
        <FileSpreadsheet className="size-4" />
        会計CSV出力
      </RoleGatedButton>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="gap-1" />}>
        <FileSpreadsheet className="size-4" />
        会計CSV出力
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">会計連携CSV出力</p>
            <Badge variant="secondary" className="text-xs">
              {formatBillingMonthLabel(billingMonth)}
            </Badge>
          </div>

          {unconfirmedCount > 0 && (
            <Alert className="bg-warning/10 border-warning/20 text-warning">
              <AlertTriangle className="size-4" />
              <AlertDescription className="text-warning text-xs">
                未確定データが混在しています
                <br />
                {formatBillingMonthLabel(billingMonth)}に未確定データが{unconfirmedCount}
                件含まれています。確定済みデータのみで出力します。
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">仕訳種別</p>
            <FieldGroup className="gap-2">
              {JOURNAL_TYPE_ITEMS.map((item) => (
                <Field
                  key={item.key}
                  orientation="horizontal"
                  data-disabled={outputMode === 'batch' ? true : undefined}
                >
                  <Checkbox
                    id={`journal-type-${item.key}`}
                    className="size-4"
                    checked={journalTypes[item.key]}
                    disabled={outputMode === 'batch'}
                    onCheckedChange={(checked) =>
                      setJournalTypes((prev) => ({
                        ...prev,
                        [item.key]: checked === true,
                      }))
                    }
                  />
                  <FieldLabel htmlFor={`journal-type-${item.key}`} className="text-xs font-normal">
                    {item.label}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">出力形式</p>
            <RadioGroup
              value={outputMode}
              onValueChange={(value) => setOutputMode(value as OutputMode)}
              className="flex flex-col gap-2"
            >
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <RadioGroupItem value="individual" className="size-4" />
                個別出力
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <RadioGroupItem value="batch" className="size-4" />
                一括出力
              </label>
            </RadioGroup>
          </div>

          <Separator />

          <div className="w-full space-y-2">
            <RoleGatedButton
              requiredPermission={Permission.SalesExport}
              size="sm"
              fullWidth
              className="gap-2"
              disabled={
                isPending || (outputMode === 'individual' && selectedEntryTypes.length === 0)
              }
              onClick={() => mutate()}
            >
              <Download className="size-4" />
              CSV出力
            </RoleGatedButton>
            <p className="text-muted-foreground text-[10px]">
              ※前月分の確定済みデータのみが出力対象です
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SalesCsvExportButton(props: Readonly<SalesCsvExportButtonProps>) {
  return (
    <Suspense
      fallback={
        <RoleGatedButton
          requiredPermission={Permission.SalesExport}
          variant="outline"
          className="gap-1"
          disabled
        >
          <FileSpreadsheet className="size-4" />
          会計CSV出力
        </RoleGatedButton>
      }
    >
      <SalesCsvExportButtonContent {...props} />
    </Suspense>
  );
}
