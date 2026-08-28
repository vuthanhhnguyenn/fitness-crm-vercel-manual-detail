'use client';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { ExerciseForm } from '../_components/exercise-form';

export default function ExerciseCreatePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="エクササイズ管理に戻る" href={navigate('/exercises')} />}
        title="エクササイズ 新規登録"
      />
      <ExerciseForm mode="create" />
    </div>
  );
}
