'use client';

import { Badge } from '@/components/ui/badge';

type LessonStatus = 'attended' | 'absent' | 'cancelled' | 'reserved';

const LESSON_STATUS_CONFIG: Record<LessonStatus, { label: string; className: string }> = {
  attended: {
    label: '受講済み',
    className: 'bg-success/15 text-success border-success/20',
  },
  absent: {
    label: '欠席',
    className: 'bg-warning/15 text-warning border-warning/20',
  },
  cancelled: {
    label: 'キャンセル',
    className: 'bg-warning/15 text-warning border-warning/20',
  },
  reserved: {
    label: '予約中',
    className: 'bg-info/15 text-info border-info/20',
  },
};

interface LessonStatusBadgeProps {
  readonly status: LessonStatus;
}

export function LessonStatusBadge(props: LessonStatusBadgeProps) {
  const { status } = props;
  const { label, className } = LESSON_STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={`text-[10px] ${className}`}>
      {label}
    </Badge>
  );
}
