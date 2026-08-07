'use client';

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

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

const STATUS_CONFIG: Record<
  VisitExperienceDetail['status'],
  { label: string; tone: StatusTone; icon: LucideIcon }
> = {
  application_received: { label: '申込受付', tone: 'muted', icon: Eye },
  info_missing: { label: '確認待ち', tone: 'warning', icon: AlertTriangle },
  bl_checking: { label: 'BL照合中', tone: 'destructive', icon: ShieldCheck },
  visiting: { label: '見学中', tone: 'info', icon: DoorOpen },
  visit_completed: { label: '見学終了', tone: 'muted', icon: Archive },
  membership_applied: { label: '入会申請済', tone: 'success', icon: CheckCircle2 },
  cancelled: { label: 'キャンセル', tone: 'destructive', icon: XCircle },
};

interface StatusPanelProps {
  record: VisitExperienceDetail;
  action?: React.ReactNode;
}

export function StatusPanel({ record, action }: StatusPanelProps) {
  const config = STATUS_CONFIG[record.status] ?? {
    label: record.status,
    tone: 'muted' as StatusTone,
    icon: HelpCircle,
  };

  const reservedAt = new Date(record.reserved_at).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <StatusCard
      tone={config.tone}
      icon={config.icon}
      label={config.label}
      meta={`予約受付: ${reservedAt}`}
      action={action}
    />
  );
}
