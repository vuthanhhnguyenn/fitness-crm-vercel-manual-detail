'use client';

import type { ReactNode } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmLockersSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { RouteKey } from '@/lib/routes/routes.type';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { LockerListCsvExportButton } from './_components/locker-list-csv-export-button';

type LockerTab = 'lockers' | 'contracts' | 'pending';

const LOCKER_TAB_ROUTES: Record<LockerTab, RouteKey> = {
  lockers: '/lockers',
  contracts: '/lockers/contracts',
  pending: '/lockers/pending',
};

const LOCKER_CREATE_CONFIG: Partial<
  Record<LockerTab, { route: RouteKey; permission: Permission; denyTooltip: string }>
> = {
  lockers: {
    route: '/lockers/create',
    permission: Permission.LockersCreate,
    denyTooltip: 'ロッカー登録の権限がありません',
  },
  contracts: {
    route: '/lockers/contracts/create',
    permission: Permission.LockersContractsCreate,
    denyTooltip: 'ロッカー契約登録の権限がありません',
  },
};

const CSV_EXPORT_CONFIG: Partial<
  Record<LockerTab, { permission: Permission; denyTooltip: string }>
> = {
  lockers: {
    permission: Permission.LockersExport,
    denyTooltip: 'CSV出力の権限がありません',
  },
  contracts: {
    permission: Permission.LockersContractsExport,
    denyTooltip: 'CSV出力の権限がありません',
  },
  pending: {
    permission: Permission.LockersPendingExport,
    denyTooltip: 'CSV出力の権限がありません',
  },
};

const TAB_VIEW_PERMISSIONS: Partial<Record<LockerTab, Permission>> = {
  lockers: Permission.LockersView,
  contracts: Permission.LockersContractsView,
  pending: Permission.LockersPendingView,
};

function getActiveTab(pathname: string): LockerTab | null {
  if (pathname === navigate('/lockers/contracts')) return 'contracts';
  if (pathname === navigate('/lockers/pending')) return 'pending';
  if (pathname === navigate('/lockers')) return 'lockers';
  return null;
}

export default function LockersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission } = useAuthUser();
  const activeTab = getActiveTab(pathname);

  const { data: summary } = useQuery({
    ...getCrmLockersSummaryOptions(),
    enabled: activeTab !== null,
  });

  if (!activeTab) {
    return children;
  }

  const handleTabChange = (tab: string) => {
    const routeKey = LOCKER_TAB_ROUTES[tab as LockerTab];
    if (routeKey) {
      router.push(navigate(routeKey));
    }
  };

  const createConfig = LOCKER_CREATE_CONFIG[activeTab];
  const csvExportConfig = CSV_EXPORT_CONFIG[activeTab];
  const visibleTabs = (Object.keys(LOCKER_TAB_ROUTES) as LockerTab[]).filter((tab) => {
    const required = TAB_VIEW_PERMISSIONS[tab];
    return !required || hasPermission(required);
  });

  return (
    <>
      <PageHeader
        title="ロッカー管理"
        actions={
          <>
            {csvExportConfig ? (
              <LockerListCsvExportButton
                activeTab={activeTab}
                permission={csvExportConfig.permission}
                denyTooltip={csvExportConfig.denyTooltip}
              />
            ) : null}
            {createConfig ? (
              <RoleGatedButton
                requiredPermission={createConfig.permission}
                denyTooltip={createConfig.denyTooltip}
                onClick={() => router.push(navigate(createConfig.route))}
              >
                <Plus className="size-4" />
                新規登録
              </RoleGatedButton>
            ) : null}
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {visibleTabs.includes('lockers') ? (
              <TabsTrigger value="lockers" className="text-sm">
                ロッカー一覧
                <Badge
                  variant="outline"
                  className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
                >
                  {summary?.lockers_count ?? 0}
                </Badge>
              </TabsTrigger>
            ) : null}
            {visibleTabs.includes('contracts') ? (
              <TabsTrigger value="contracts" className="text-sm">
                契約一覧
                <Badge
                  variant="outline"
                  className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
                >
                  {summary?.contracts_count ?? 0}
                </Badge>
              </TabsTrigger>
            ) : null}
            {visibleTabs.includes('pending') ? (
              <TabsTrigger value="pending" className="text-sm">
                開放待ち一覧
                <Badge
                  variant="outline"
                  className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
                >
                  {summary?.pending_slots_count ?? 0}
                </Badge>
              </TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>

        {children}
      </div>
    </>
  );
}
