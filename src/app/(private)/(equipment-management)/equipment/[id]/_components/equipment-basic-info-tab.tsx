'use client';

import { useState } from 'react';

import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';

import { EquipmentControllerCard } from './equipment-controller-card';
import { EquipmentInfoCard } from './equipment-info-card';
import { EquipmentMetaCard } from './equipment-meta-card';
import { EquipmentStatusCard } from './equipment-status-card';
import { EquipmentStatusDialog } from './equipment-status-dialog';
import { EquipmentUsageRuleCard } from './equipment-usage-rule-card';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

interface EquipmentBasicInfoTabProps {
  equipment: EquipmentDetail;
}

export function EquipmentBasicInfoTab({ equipment }: EquipmentBasicInfoTabProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          <EquipmentInfoCard equipment={equipment} />
          <EquipmentUsageRuleCard equipment={equipment} />
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-0 lg:self-start">
          <EquipmentStatusCard
            equipment={equipment}
            onStatusChange={() => setStatusDialogOpen(true)}
          />
          <EquipmentControllerCard equipment={equipment} />
          <EquipmentMetaCard equipment={equipment} />
        </div>
      </div>

      <EquipmentStatusDialog
        equipment={equipment}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />
    </>
  );
}
