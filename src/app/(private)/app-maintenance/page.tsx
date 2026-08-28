import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { AppMaintenanceListSection } from './_components/app-maintenance-list-section';

export default function AppMaintenancePage() {
  return (
    <Suspense fallback={<Loading />}>
      <AppMaintenanceListSection />
    </Suspense>
  );
}
