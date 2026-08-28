import { formatDatetimeISO } from '@/utils/format.util';
import { CheckCircle2, Info, type LucideIcon, Wrench } from 'lucide-react';

import { StatusCard, type StatusTone } from '@/components/common/status-card';

import { type CrmMaintenanceStatus, CrmMaintenanceStatus as StatusEnum } from '@/lib/api/types.gen';

const STATUS_CARD_CONFIG: Record<
  CrmMaintenanceStatus,
  { tone: StatusTone; icon: LucideIcon; label: string }
> = {
  [StatusEnum.PLANNED]: { tone: 'info', icon: Info, label: '予定' },
  [StatusEnum.IN_PROGRESS]: { tone: 'warning', icon: Wrench, label: 'メンテナンス中' },
  [StatusEnum.COMPLETED]: { tone: 'muted', icon: CheckCircle2, label: '完了' },
};

interface CrmMaintenanceDetailStatusCardProps {
  status: CrmMaintenanceStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
}

export function CrmMaintenanceDetailStatusCard({
  status,
  createdAt,
  createdBy,
  updatedAt,
}: CrmMaintenanceDetailStatusCardProps) {
  const config = STATUS_CARD_CONFIG[status];

  return (
    <StatusCard
      tone={config.tone}
      icon={config.icon}
      label={config.label}
      meta={[
        `作成: ${formatDatetimeISO(createdAt)}（${createdBy}）`,
        `更新: ${updatedAt ? formatDatetimeISO(updatedAt) : '—'}`,
      ]}
    />
  );
}
