import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';
import { Skeleton } from '@/components/ui/skeleton';

import { VisitExperienceHeader } from './_components/visit-experience-header';
import { VisitExperienceKpi } from './_components/visit-experience-kpi';
import { VisitExperienceListSection } from './_components/visit-experience-list-section';

export default function VisitExperiencesPage() {
  return (
    <main className="bg-muted/40 min-h-0 flex-1 overflow-auto p-6">
      <div className="mb-6">
        <VisitExperienceHeader />
      </div>

      <div className="flex flex-col gap-6">
        <Suspense
          fallback={
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          }
        >
          <VisitExperienceKpi />
        </Suspense>

        <Suspense fallback={<Loading />}>
          <VisitExperienceListSection />
        </Suspense>
      </div>
    </main>
  );
}
