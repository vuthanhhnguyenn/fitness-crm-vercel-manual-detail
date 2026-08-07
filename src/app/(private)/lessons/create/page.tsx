'use client';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { LessonForm } from '../_components/lesson-form/lesson-form';

export default function LessonCreatePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="レッスン内容管理に戻る" href={navigate('/lessons')} />}
        title="新規レッスン作成"
      />
      <LessonForm mode="create" />
    </div>
  );
}
