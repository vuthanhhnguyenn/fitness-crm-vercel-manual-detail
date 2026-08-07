'use client';

import { Suspense } from 'react';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { Button } from '@/components/ui/button';

import { getCrmMembershipApplicationsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { MembershipApplicationsFilters } from './_components/membership-applications-filters';
import { MembershipApplicationsKpiCards } from './_components/membership-applications-kpi-cards';
import { MembershipApplicationsTable } from './_components/membership-applications-table';
import { MembershipApplicationsFiltersProvider } from './_contexts/membership-applications-filters-context';
import { useMembershipApplicationsFilters } from './_hooks/use-membership-applications-filters';

function MembershipApplicationsPageContent() {
  const filtersHook = useMembershipApplicationsFilters();

  // Fetch all (no pagination) for KPI cards — use a separate query with large limit
  const { data: allData } = useQuery(
    getCrmMembershipApplicationsOptions({ query: { limit: 1000 } }),
  );

  return (
    <MembershipApplicationsFiltersProvider value={filtersHook}>
      <main className="bg-muted/40 min-h-0 flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">入会申請管理</h1>
            <p className="text-muted-foreground text-sm">全店舗</p>
          </div>
          <Button
            nativeButton={false}
            render={
              <Link href={navigate('/membership-applications/create')}>
                <Plus className="mr-2 size-4" />
                新規入会登録
              </Link>
            }
          />
        </div>

        <div className="flex flex-col gap-6">
          <MembershipApplicationsKpiCards applications={allData?.applications ?? []} />

          <div className="bg-card overflow-hidden rounded-xl border">
            <MembershipApplicationsFilters />
            <MembershipApplicationsTable />
          </div>
        </div>
      </main>
    </MembershipApplicationsFiltersProvider>
  );
}

export default function MembershipApplicationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MembershipApplicationsPageContent />
    </Suspense>
  );
}
