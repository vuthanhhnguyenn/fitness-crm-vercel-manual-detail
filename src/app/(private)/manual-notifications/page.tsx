import { Suspense } from 'react';

import { ManualNotificationsPageContent } from './_components/manual-notifications-page-content';

export default function ManualNotificationsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground px-6 py-4 text-sm">Loading...</div>}>
      <ManualNotificationsPageContent />
    </Suspense>
  );
}
