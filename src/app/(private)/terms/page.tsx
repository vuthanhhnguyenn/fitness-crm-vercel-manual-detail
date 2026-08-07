import { Suspense } from 'react';

import { TermsPageContent } from './_components/terms-page-content';

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground px-6 py-4 text-sm">Loading...</div>}>
      <TermsPageContent />
    </Suspense>
  );
}
