import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { EntryExitHistoryContent } from './_components/entry-exit-history-content';

export default function EntryExitHistoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EntryExitHistoryContent />
    </Suspense>
  );
}
