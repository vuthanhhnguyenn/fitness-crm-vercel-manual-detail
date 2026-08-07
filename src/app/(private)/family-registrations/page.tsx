'use client';

import { FamilyRegistrationsHeader } from './_components/family-registrations-header';
import { FamilyRegistrationsListSection } from './_components/family-registrations-section';
import { FamilyRegistrationsSummary } from './_components/family-registrations-summary';

const BREADCRUMB_ITEMS = [{ url: '/members', label: '会員管理' }, { label: '家族入会' }] as const;

export default function FamilyRegistrationsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <FamilyRegistrationsHeader breadcrumbItems={BREADCRUMB_ITEMS} />
      <div className="bg-muted/30 space-y-4 p-4">
        <FamilyRegistrationsSummary />
      </div>
      <div>
        <FamilyRegistrationsListSection />
      </div>
    </div>
  );
}
