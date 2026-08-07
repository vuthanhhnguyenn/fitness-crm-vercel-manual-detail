import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { PageHeader } from '@/components/common/page-header';

import { EnrollmentForm } from './_components/enrollment-form';

export default async function NewMembershipApplicationPage() {
  return (
    <main className="bg-muted/40 min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto mb-4 max-w-240">
        <PageHeader
          breadcrumb={
            <BreadcrumbNav
              items={[
                { label: '入会申請管理', url: '/membership-applications' },
                { label: '管理画面入会' },
              ]}
            />
          }
          title="管理画面入会"
          className="px-0"
        />
      </div>
      <EnrollmentForm />
    </main>
  );
}
