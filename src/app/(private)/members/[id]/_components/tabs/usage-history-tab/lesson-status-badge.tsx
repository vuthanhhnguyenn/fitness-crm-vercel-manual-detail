'use client';

import { Badge } from '@/components/ui/badge';

interface LessonStatusBadgeProps {
  readonly status: 'attended' | 'absent' | 'cancelled' | 'reserved';
}

export function LessonStatusBadge(props: LessonStatusBadgeProps) {
  const { status } = props;
  const config: Record<typeof status, { label: string; className: string }> = {
    attended: {
      label: '参加済み',
      className: 'bg-success/15 text-success border-success/20',
    },
    absent: {
      label: '欠席',
      className: 'bg-warning/15 text-warning border-warning/20',
    },
    cancelled: {
      label: 'キャンセル',
      className: 'bg-muted text-muted-foreground border-muted',
    },
    reserved: {
      label: '予約済み',
      className: 'bg-info/15 text-info border-info/20',
    },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={`text-[10px] ${className}`}>
      {label}
    </Badge>
  );
}
