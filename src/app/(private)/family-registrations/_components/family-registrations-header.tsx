'use client';

import { BookUser } from 'lucide-react';

import { type BreadcrumbItemType, BreadcrumbNav } from '@/components/common/breadcrumb-nav';

type FamilyRegistrationsHeaderProps = {
  breadcrumbItems: readonly BreadcrumbItemType[];
};

export function FamilyRegistrationsHeader({
  breadcrumbItems,
}: Readonly<FamilyRegistrationsHeaderProps>) {
  return (
    <div className="flex items-center gap-2 border-b px-4 py-4">
      <div className="text-muted-foreground flex size-6 items-center justify-center">
        <BookUser className="size-6" />
      </div>
      <BreadcrumbNav items={breadcrumbItems} variant="section" />
    </div>
  );
}
