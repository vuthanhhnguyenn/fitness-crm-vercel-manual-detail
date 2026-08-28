'use client';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  DoorOpen,
  Eye,
  HelpCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { StatusCard, type StatusTone } from '@/components/common/status-card';

import {
  VISIT_EXPERIENCE_STATUS_LABELS,
  type VisitExperienceDetail,
} from '@/types/api/visit-experience.type';

const STATUS_CONFIG: Record<
  VisitExperienceDetail['status'],
  { tone: StatusTone; icon: LucideIcon }
> = {
  application_received: { tone: 'muted', icon: Eye },
  info_missing: { tone: 'warning', icon: AlertTriangle },
  bl_checking: { tone: 'destructive', icon: ShieldCheck },
  visiting: { tone: 'info', icon: DoorOpen },
  visit_completed: { tone: 'muted', icon: Archive },
  membership_applied: { tone: 'success', icon: CheckCircle2 },
  cancelled: { tone: 'destructive', icon: XCircle },
};

interface StatusPanelProps {
  record: VisitExperienceDetail;
  action?: React.ReactNode;
}

export function StatusPanel({ record, action }: StatusPanelProps) {
  const config = STATUS_CONFIG[record.status] ?? {
    tone: 'muted' as StatusTone,
    icon: HelpCircle,
  };
  const label = VISIT_EXPERIENCE_STATUS_LABELS[record.status] ?? record.status;

  const reservedAt = formatDateYYYYMMDD_HHMM(record.reserved_at);

  return (
    <StatusCard
      tone={config.tone}
      icon={config.icon}
      label={label}
      meta={`予約受付: ${reservedAt}`}
      action={action}
    />
  );
}
