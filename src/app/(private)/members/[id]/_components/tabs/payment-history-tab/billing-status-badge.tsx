'use client';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

type BillingStatus = 'pending' | 'confirmed' | 'paid' | 'uncollected' | 'written-off';

interface BillingStatusBadgeProps {
  readonly status: BillingStatus;
}

/**
 * Colours mirror the prototype's `getBillingStatusClass`
 * (.cache/fitness-crm-ui/src/pages/member-detail.tsx) — semantic theme tokens, not raw palette
 * colours, so the badge follows light/dark theming.
 */
const STATUS_CONFIG: Record<BillingStatus, { label: string; className: string }> = {
  pending: {
    label: '未確定',
    className: 'bg-warning/15 text-warning border-warning/20',
  },
  confirmed: {
    label: '確定',
    className: 'bg-info/15 text-info border-info/20',
  },
  paid: {
    label: '入金済み',
    className: 'bg-success/15 text-success border-success/20',
  },
  uncollected: {
    label: '未回収',
    className: 'bg-destructive/15 text-destructive border-destructive/20',
  },
  'written-off': {
    label: '貸倒',
    className: 'bg-destructive/15 text-destructive border-destructive/20',
  },
};

export function BillingStatusBadge({ status }: BillingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn('text-[10px]', config.className)}>
      {config.label}
    </Badge>
  );
}
