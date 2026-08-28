import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { CrmMaintenanceListSection } from './_components/crm-maintenance-list-section';

export default function CrmMaintenancePage() {
  return (
    <Suspense fallback={<Loading />}>
      <CrmMaintenanceListSection />
    </Suspense>
  );
}
