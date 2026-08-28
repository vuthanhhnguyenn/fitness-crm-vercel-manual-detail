'use client';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { CrmMaintenanceForm } from '../_components/crm-maintenance-form/crm-maintenance-form';

export default function CrmMaintenanceCreatePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={
          <BackLink label="CRMメンテナンス管理に戻る" href={navigate('/crm-maintenance')} />
        }
        title="CRMメンテナンス新規登録"
      />
      <CrmMaintenanceForm mode="create" />
    </div>
  );
}
