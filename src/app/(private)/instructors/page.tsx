import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { InstructorListSection } from './_components/instructor-list-section';

export default function InstructorsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InstructorListSection />
    </Suspense>
  );
}
