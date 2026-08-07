'use client';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

interface BillingStatusBadgeProps {
  readonly status: 'pending' | 'paid' | 'uncollected' | 'written-off';
}

export function BillingStatusBadge({ status }: BillingStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: '未確定',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    paid: {
      label: '入金済み',
      className: 'border-green-200 bg-green-50 text-green-700',
    },
    uncollected: {
      label: '未回収',
      className: 'border-orange-200 bg-orange-50 text-orange-700',
    },
    'written-off': {
      label: '貸倒',
      className: 'border-destructive/30 bg-destructive/10 text-destructive',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn('text-[10px]', config.className)}>
      {config.label}
    </Badge>
  );
}
