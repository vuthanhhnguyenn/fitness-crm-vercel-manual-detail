'use client';

import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';

import { getCrmTransfersByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { TransferApprovalFlow } from './_components/transfer-approval-flow';
import { TransferDetailInfo } from './_components/transfer-detail-info';
import { TransferDetailSkeleton } from './_components/transfer-detail-skeleton';
import { TransferStatusAction } from './_components/transfer-status-action';
import { TransferStatusBadge } from './_components/transfer-status-badge';

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isPending, isError } = useQuery({
    ...getCrmTransfersByIdOptions({ path: { id } }),
  });

  const transfer = data?.transfer;

  return (
    <DataStateBoundary
      isLoading={isPending}
      isError={isError}
      isEmpty={!transfer}
      skeleton={<TransferDetailSkeleton />}
    >
      <div className="flex flex-col gap-4 p-6">
        <BreadcrumbNav
          items={[
            { url: navigate('/members/transfers'), label: '移籍管理' },
            { label: transfer?.id ?? id },
          ]}
        />

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{transfer?.id}</h1>
          {transfer && <TransferStatusBadge status={transfer.status} />}
        </div>

        {transfer && (
          <div className="flex gap-4">
            {/* Left column — 60% */}
            <div className="flex w-[60%] flex-col gap-4">
              <TransferDetailInfo transfer={transfer} />
              <TransferApprovalFlow transfer={transfer} />
            </div>

            {/* Right column — 40% */}
            <div className="w-[40%]">
              <TransferStatusAction transfer={transfer} />
            </div>
          </div>
        )}
      </div>
    </DataStateBoundary>
  );
}
