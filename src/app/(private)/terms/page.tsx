import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { TermsListSection } from './_components/terms-list-section';

export default function TermsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TermsListSection />
    </Suspense>
  );
}
