import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { EntryExitSection } from './_components/entry-exit-section';

export default function EntryExitPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EntryExitSection />
    </Suspense>
  );
}
