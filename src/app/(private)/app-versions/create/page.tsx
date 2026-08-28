import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { AppVersionForm } from '../_components/app-version-form/app-version-form';

export default function AppVersionCreatePage() {
  return (
    <>
      <PageHeader
        breadcrumb={
          <BackLink label="アプリ配信バージョン管理に戻る" href={navigate('/app-versions')} />
        }
        title="バージョン登録"
      />

      <AppVersionForm mode="create" />
    </>
  );
}
