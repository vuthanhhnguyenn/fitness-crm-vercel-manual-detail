'use client';

import { Suspense } from 'react';

import { Loading } from '@/components/common/data-state-boundary/loading';

import { LessonsPageContent } from './_components/lessons-page-content';

export default function LessonsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LessonsPageContent />
    </Suspense>
  );
}
