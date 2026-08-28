'use client';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { AppMaintenanceForm } from '../_components/app-maintenance-form/app-maintenance-form';

export default function AppMaintenanceCreatePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={
          <BackLink label="アプリメンテナンス管理に戻る" href={navigate('/app-maintenance')} />
        }
        title="アプリメンテナンス新規登録"
      />
      <AppMaintenanceForm mode="create" />
    </div>
  );
}
