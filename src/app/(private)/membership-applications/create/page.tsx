import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { EnrollmentForm } from './_components/enrollment-form';

interface PageProps {
  searchParams: Promise<{
    customer_name?: string;
    customer_name_kana?: string;
    birth_date?: string;
    phone?: string;
    email?: string;
  }>;
}

function splitName(fullName: string | undefined): { family: string; given: string } {
  if (!fullName) return { family: '', given: '' };
  const [family = '', given = ''] = fullName.split(/[\s　]+/);
  return { family, given };
}

export default async function NewMembershipApplicationPage({ searchParams }: Readonly<PageProps>) {
  const params = await searchParams;
  const name = splitName(params.customer_name);
  const kana = splitName(params.customer_name_kana);

  return (
    <main>
      <PageHeader
        breadcrumb={
          <BackLink label="入会申請管理に戻る" href={navigate('/membership-applications')} />
        }
        title="管理画面入会"
      />
      <div className="px-6 py-4">
        <EnrollmentForm
          prefillFamilyName={name.family}
          prefillGivenName={name.given}
          prefillFamilyNameKana={kana.family}
          prefillGivenNameKana={kana.given}
          prefillBirthDate={params.birth_date}
          prefillPhone={params.phone}
          prefillEmail={params.email}
        />
      </div>
    </main>
  );
}
