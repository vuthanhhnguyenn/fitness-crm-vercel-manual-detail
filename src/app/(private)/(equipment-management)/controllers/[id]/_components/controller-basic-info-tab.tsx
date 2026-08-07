'use client';

import { useState } from 'react';

import type { GetCrmControllersByIdResponse } from '@/lib/api/types.gen';

import { ControllerDeviceSummaryCard } from './controller-device-summary-card';
import { ControllerInfoCard } from './controller-info-card';
import { ControllerMetaCard } from './controller-meta-card';
import { ControllerStatusCard } from './controller-status-card';
import { ControllerStatusDialog } from './controller-status-dialog';

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

interface ControllerBasicInfoTabProps {
  controller: ControllerDetail;
  onViewDevices: () => void;
}

export function ControllerBasicInfoTab({ controller, onViewDevices }: ControllerBasicInfoTabProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          <ControllerInfoCard controller={controller} />
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-0 lg:self-start">
          <ControllerStatusCard
            controller={controller}
            onStatusChange={() => setStatusDialogOpen(true)}
          />
          <ControllerDeviceSummaryCard controller={controller} onViewDevices={onViewDevices} />
          <ControllerMetaCard controller={controller} />
        </div>
      </div>

      <ControllerStatusDialog
        controller={controller}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />
    </>
  );
}
