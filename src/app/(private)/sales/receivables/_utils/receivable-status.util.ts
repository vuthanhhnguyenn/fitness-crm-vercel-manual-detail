import type { ReceivableStatus } from '@/lib/api/types.gen';

export const RECEIVABLE_STATUS_LABELS: Record<NonNullable<ReceivableStatus>, string> = {
  uncollected: '未回収',
  rebilling: '再請求中',
  convenience_payment_in_progress: 'コンビニ決済中',
  bad_debt_target: '貸倒対象',
  bad_debt_excluded: '貸倒対象外',
};

export function getReceivableStatusLabel(status: ReceivableStatus | null): string {
  return status ? RECEIVABLE_STATUS_LABELS[status] : '—';
}

export function getReceivableStatusBadgeClass(status: ReceivableStatus | null): string {
  switch (status) {
    case 'uncollected':
      return 'bg-destructive/15 text-destructive border-destructive/20';
    case 'rebilling':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'convenience_payment_in_progress':
      return 'bg-info/15 text-info border-info/20';
    case 'bad_debt_target':
      return 'bg-muted text-muted-foreground border-border';
    case 'bad_debt_excluded':
      return 'bg-success/15 text-success border-success/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
