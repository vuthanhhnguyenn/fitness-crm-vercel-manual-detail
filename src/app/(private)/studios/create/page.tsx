import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { StudioForm } from '../_components/studio-form/studio-form';

export default function StudioCreatePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="スタジオ管理に戻る" href="/studios" />}
        title="新規スタジオ登録"
      />
      <StudioForm mode="create" />
    </div>
  );
}
