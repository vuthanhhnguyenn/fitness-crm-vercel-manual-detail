import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { StudioListSection } from './_components/studio-list-section';

export default function StudiosPage() {
  return (
    <Suspense fallback={<Loading />}>
      <StudioListSection />
    </Suspense>
  );
}
