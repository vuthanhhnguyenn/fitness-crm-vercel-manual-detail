'use client';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { MemberHeadupCard } from '@/components/common/member-headup-card';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { getCrmTransfersByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { MemberType } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { MEMBER_TYPE_LABELS } from '../../_constants/constants';
import { TransferStatusBadge } from '../_components/transfer-status-badge';
import { TransferApprovalFlow } from './_components/transfer-approval-flow';
import { TransferDetailInfo } from './_components/transfer-detail-info';
import { TransferDetailSkeleton } from './_components/transfer-detail-skeleton';
import { TransferExclusionAlert } from './_components/transfer-exclusion-alert';
import { TransferStatusAction } from './_components/transfer-status-action';

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isPending, isError } = useQuery({
    ...getCrmTransfersByIdOptions({ path: { id } }),
  });

  const transfer = data?.transfer;

  // A single-record read is exactly the case DataStateBoundary is for: there are no filters to
  // keep mounted, so a full-region error + retry is the right recovery UI here (unlike the list).
  return (
    <DataStateBoundary
      isLoading={isPending}
      isError={isError}
      isEmpty={!transfer}
      skeleton={<TransferDetailSkeleton />}
    >
      {transfer && (
        <>
          <PageHeader
            breadcrumb={<BackLink label="移籍管理に戻る" href={navigate('/members/transfers')} />}
            title={`${transfer.member_name} さんの移籍申請`}
            badge={
              <>
                <Badge variant="secondary" className="font-mono text-xs font-medium">
                  {transfer.id}
                </Badge>
                <TransferStatusBadge status={transfer.status} />
              </>
            }
          />

          <div className="flex flex-col gap-4 p-6">
            <MemberHeadupCard
              memberId={transfer.member_id}
              oldMemberNo={transfer.old_member_no}
              name={transfer.member_name}
              nameKana={transfer.member_name_kana}
              // The API carries the raw enum; the head-up shows the Japanese label the rest of
              // the member screens use, so the two never read differently.
              memberType={
                transfer.member_type
                  ? (MEMBER_TYPE_LABELS[transfer.member_type as MemberType] ?? transfer.member_type)
                  : null
              }
              contractName={transfer.contract_name}
              asideContent={
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">移籍元店舗</p>
                    <p className="text-sm font-medium">{transfer.from_store_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => router.push(navigate('/members/[id]', transfer.member_id))}
                  >
                    会員詳細を開く
                    <ArrowUpRight className="size-4" />
                  </Button>
                </div>
              }
            />

            <TransferExclusionAlert transfer={transfer} />

            <div className="flex gap-4">
              {/* Left column — 60% */}
              <div className="flex w-[60%] flex-col gap-4">
                <TransferDetailInfo transfer={transfer} />
                <TransferApprovalFlow transfer={transfer} />
              </div>

              {/* Right column — 40%, sticky */}
              <div className="w-[40%]">
                <TransferStatusAction transfer={transfer} />
              </div>
            </div>
          </div>
        </>
      )}
    </DataStateBoundary>
  );
}
