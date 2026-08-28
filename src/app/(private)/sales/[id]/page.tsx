'use client';

// Client component: detail requires React Query fetch/mutation state and interactive dialogs.
import { useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmBillingRecordsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BillingBasicTab } from './_components/billing-basic-tab';
import { BillingDetailSkeleton } from './_components/billing-detail-skeleton';
import { BillingDocumentExportMenu } from './_components/billing-document-export-menu';
import { BillingHistoryTab } from './_components/billing-history-tab';

export default function SalesDetailPage() {
  const params = useParams();
  const billingRecordId = params.id as string;
  const [activeTab, setActiveTab] = useState('basic');

  const {
    data: record,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...getCrmBillingRecordsByIdOptions({ path: { id: billingRecordId } }),
    enabled: Boolean(billingRecordId),
  });
  const isNotFound = error?.message === 'NOT_FOUND';

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError && !isNotFound}
      isEmpty={isNotFound || !record}
      onRetry={() => void refetch()}
      emptyTitle="請求が見つかりません"
      emptyDescription={`指定された請求ID（${billingRecordId}）は存在しません。`}
      skeleton={<BillingDetailSkeleton />}
    >
      {record && (
        <div className="flex flex-col">
          <PageHeader
            breadcrumb={<BackLink label="売上管理に戻る" href={navigate('/sales')} />}
            title={`請求 #${record.id}`}
            subtitle={
              <>
                <Link
                  href={navigate('/members/[id]', record.member_id)}
                  className="text-primary inline-flex items-center gap-0.5 align-middle underline-offset-2 hover:underline"
                >
                  {record.member_name}
                  <ArrowUpRight className="size-3" />
                </Link>
                {` — ${record.store_name}`}
              </>
            }
            actions={
              <BillingDocumentExportMenu
                billingRecordId={record.id}
                lineItems={record.line_items}
              />
            }
          />

          <div className="px-6 py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
              <TabsList variant="line">
                <TabsTrigger value="basic">基本情報</TabsTrigger>
                <TabsTrigger value="history">変更履歴</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <BillingBasicTab record={record} />
              </TabsContent>

              <TabsContent value="history">
                <BillingHistoryTab
                  feeAdjustments={record.fee_adjustments}
                  lineItems={record.line_items}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </DataStateBoundary>
  );
}
