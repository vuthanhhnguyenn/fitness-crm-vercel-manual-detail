import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { ManualRegistrationForm } from '../_components/manual-registration-form/manual-registration-form';

export default function SalesRegisterPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="売上管理に戻る" href={navigate('/sales')} />}
        title="請求の手動追加"
      />
      <div className="bg-background flex-1 px-6 py-4">
        <ManualRegistrationForm />
      </div>
    </div>
  );
}
