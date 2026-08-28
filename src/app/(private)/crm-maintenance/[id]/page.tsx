'use client';

import { useParams } from 'next/navigation';

import { CrmMaintenanceDetailSection } from '../_components/detail/crm-maintenance-detail-section';

export default function CrmMaintenanceDetailPage() {
  const params = useParams();
  const maintenanceId = params.id as string;

  return <CrmMaintenanceDetailSection maintenanceId={maintenanceId} />;
}
