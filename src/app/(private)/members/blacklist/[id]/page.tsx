'use client';

import { useParams } from 'next/navigation';

import { formatDatetimeISO } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { ShieldBan } from 'lucide-react';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { StatusCard } from '@/components/common/status-card';
import type { StatusTone } from '@/components/common/status-card';

import { getCrmBlacklistByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BlacklistSourceBadge } from '../_components/blacklist-source-badge';
import { BLACKLIST_REGISTRATION_SOURCE_LABEL } from '../_constants/blacklist.constants';
import { BlacklistDetailInfo } from './_components/blacklist-detail-info';
import { BlacklistDetailSkeleton } from './_components/blacklist-detail-skeleton';
import { BlacklistMatchConditions } from './_components/blacklist-match-conditions';
import { BlacklistUnpaidCard } from './_components/blacklist-unpaid-card';

function getStatusTone(source: 'forced_withdrawal' | 'manual'): StatusTone {
  return source === 'forced_withdrawal' ? 'destructive' : 'warning';
}

export default function BlacklistDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isPending, isError } = useQuery({
    ...getCrmBlacklistByIdOptions({ path: { id } }),
  });

  const blacklist = data?.blacklist;

  return (
    <DataStateBoundary
      isLoading={isPending}
      isError={isError}
      isEmpty={!blacklist}
      skeleton={<BlacklistDetailSkeleton />}
    >
      <div className="flex flex-col gap-4 p-6">
        <BreadcrumbNav
          items={[
            { url: navigate('/members/blacklist'), label: 'ブラックリスト管理' },
            { label: blacklist?.memberId ?? id },
          ]}
        />

        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{blacklist?.memberId}</h1>
          {blacklist && <BlacklistSourceBadge source={blacklist.registrationSource} />}
        </div>

        {blacklist && (
          <div className="flex gap-4">
            {/* Left column — 60% */}
            <div className="flex w-[60%] flex-col gap-4">
              <BlacklistDetailInfo blacklist={blacklist} />
              <BlacklistMatchConditions matchConditions={blacklist.matchConditions} />
              <BlacklistUnpaidCard unpaidAmount={blacklist.unpaidAmount} />
            </div>

            {/* Right column — 40% */}
            <div className="w-[40%]">
              <div className="sticky top-6">
                <StatusCard
                  tone={getStatusTone(blacklist.registrationSource)}
                  icon={ShieldBan}
                  label={BLACKLIST_REGISTRATION_SOURCE_LABEL[blacklist.registrationSource]}
                  meta={[`登録日: ${formatDatetimeISO(blacklist.registeredAt)}`]}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DataStateBoundary>
  );
}
