'use client';

import { Suspense } from 'react';

import { Download } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';

import type { Permission } from '@/types/permission.type';

import {
  useLockerContractsCsvExport,
  useLockerPendingSlotsCsvExport,
  useLockersCsvExport,
} from '../_hooks/use-locker-csv-export.hook';
import { useLockersFilters } from '../_hooks/use-lockers-filters';
import { useLockerContractsFilters } from '../contracts/_hooks/use-locker-contracts-filters';
import { useLockerPendingSlotsFilters } from '../pending/_hooks/use-locker-pending-slots-filters';

type LockerListTab = 'lockers' | 'contracts' | 'pending';

/** The CSV export button label follows the active tab (prototype: locker management header) */
const CSV_EXPORT_LABELS: Record<LockerListTab, string> = {
  lockers: 'ロッカー一覧をCSV出力',
  contracts: '契約一覧をCSV出力',
  pending: '開放待ち一覧をCSV出力',
};

type LockerListCsvExportButtonProps = {
  activeTab: LockerListTab;
  permission: Permission;
  denyTooltip: string;
};

function LockersTabCsvExportButton({
  permission,
  denyTooltip,
}: Omit<LockerListCsvExportButtonProps, 'activeTab'>) {
  const { exportQueryParams } = useLockersFilters();
  const { mutate: exportCsv, isPending } = useLockersCsvExport();

  return (
    <RoleGatedButton
      variant="outline"
      className="gap-1 whitespace-nowrap"
      requiredPermission={permission}
      denyTooltip={denyTooltip}
      onClick={() => exportCsv({ body: exportQueryParams })}
      disabled={isPending}
    >
      <Download className="size-4" />
      {CSV_EXPORT_LABELS.lockers}
    </RoleGatedButton>
  );
}

function ContractsTabCsvExportButton({
  permission,
  denyTooltip,
}: Omit<LockerListCsvExportButtonProps, 'activeTab'>) {
  const { exportQueryParams } = useLockerContractsFilters();
  const { mutate: exportCsv, isPending } = useLockerContractsCsvExport();

  return (
    <RoleGatedButton
      variant="outline"
      className="gap-1 whitespace-nowrap"
      requiredPermission={permission}
      denyTooltip={denyTooltip}
      onClick={() => exportCsv({ body: exportQueryParams })}
      disabled={isPending}
    >
      <Download className="size-4" />
      {CSV_EXPORT_LABELS.contracts}
    </RoleGatedButton>
  );
}

function PendingTabCsvExportButton({
  permission,
  denyTooltip,
}: Omit<LockerListCsvExportButtonProps, 'activeTab'>) {
  const { exportQueryParams } = useLockerPendingSlotsFilters();
  const { mutate: exportCsv, isPending } = useLockerPendingSlotsCsvExport();

  return (
    <RoleGatedButton
      variant="outline"
      className="gap-1 whitespace-nowrap"
      requiredPermission={permission}
      denyTooltip={denyTooltip}
      onClick={() => exportCsv({ body: exportQueryParams })}
      disabled={isPending}
    >
      <Download className="size-4" />
      {CSV_EXPORT_LABELS.pending}
    </RoleGatedButton>
  );
}

function LockerListCsvExportButtonContent({
  activeTab,
  permission,
  denyTooltip,
}: LockerListCsvExportButtonProps) {
  if (activeTab === 'lockers') {
    return <LockersTabCsvExportButton permission={permission} denyTooltip={denyTooltip} />;
  }

  if (activeTab === 'contracts') {
    return <ContractsTabCsvExportButton permission={permission} denyTooltip={denyTooltip} />;
  }

  return <PendingTabCsvExportButton permission={permission} denyTooltip={denyTooltip} />;
}

export function LockerListCsvExportButton(props: LockerListCsvExportButtonProps) {
  return (
    <Suspense
      fallback={
        <Button variant="outline" className="gap-1 whitespace-nowrap" disabled>
          <Download className="size-4" />
          {CSV_EXPORT_LABELS[props.activeTab]}
        </Button>
      }
    >
      <LockerListCsvExportButtonContent {...props} />
    </Suspense>
  );
}
