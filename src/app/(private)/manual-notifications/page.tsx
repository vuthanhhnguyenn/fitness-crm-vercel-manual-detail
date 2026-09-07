import { Suspense } from 'react';

import { ManualNotificationsPageContent } from './_components/manual-notifications-page-content';
import { ManualNotificationsPageSkeleton } from './_components/manual-notifications-page-skeleton';

export default function ManualNotificationsPage() {
  return (
    <Suspense fallback={<ManualNotificationsPageSkeleton />}>
      <ManualNotificationsPageContent />
    </Suspense>
  );
}
