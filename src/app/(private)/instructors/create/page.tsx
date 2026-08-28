'use client';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { InstructorForm } from '../_components/instructor-form/instructor-form';

export default function InstructorCreatePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="指導者管理に戻る" href={navigate('/instructors')} />}
        title="新規指導者登録"
      />
      <InstructorForm mode="create" />
    </div>
  );
}
