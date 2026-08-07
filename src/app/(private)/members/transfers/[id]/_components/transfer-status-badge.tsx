'use client';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

type TransferStatus = 'pending' | 'from_store_approved' | 'approved' | 'rejected' | 'completed';

const STATUS_LABELS: Record<TransferStatus, string> = {
  pending: '申請中',
  from_store_approved: '店舗承認済',
  approved: '承認済',
  rejected: '却下',
  completed: '移籍完了',
};

const STATUS_CLASSES: Record<Exclude<TransferStatus, 'completed'>, string> = {
  pending: 'bg-info/15 text-info border-info/20',
  from_store_approved: 'bg-warning/15 text-warning border-warning/20',
  approved: 'bg-success/15 text-success border-success/20',
  rejected: 'bg-destructive/15 text-destructive border-destructive/20',
};

const DOT_CLASSES: Record<Exclude<TransferStatus, 'completed'>, string> = {
  pending: 'bg-info',
  from_store_approved: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-destructive',
};

export function TransferStatusBadge({
  status,
  className,
}: Readonly<{ status: TransferStatus; className?: string }>) {
  if (status === 'completed') {
    return (
      <Badge variant="secondary" className={cn('text-xs font-medium', className)}>
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 text-xs font-medium', STATUS_CLASSES[status], className)}
    >
      <span className={cn('size-1.5 rounded-full', DOT_CLASSES[status])} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
