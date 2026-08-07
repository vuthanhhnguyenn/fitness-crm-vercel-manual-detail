import { MembershipApplicationDetail } from './_components/membership-application-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MembershipApplicationDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  return <MembershipApplicationDetail applicationId={id} />;
}
