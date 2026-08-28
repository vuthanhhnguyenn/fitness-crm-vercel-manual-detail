'use client';

import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { LockerContractsPageContent } from './_components/locker-contracts-page-content';

export default function LockerContractsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LockerContractsPageContent />
    </Suspense>
  );
}
