import { format, parseISO } from 'date-fns';

import { STATUS_OPTIONS } from '../../_constants/constants';

type ApplicationStatus = 'pending' | 'review' | 'approved' | 'rejected' | 'cancelled';

export function getStatusLabel(status: ApplicationStatus): string {
  const option = STATUS_OPTIONS.find(
    (opt: { label: string; value: string }) => opt.value === status,
  );
  return option?.label || status;
}

export function getStatusBadge(status: ApplicationStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-warning/15 text-warning border-warning/20';
    case 'approved':
      return 'bg-success/15 text-success border-success/20';
    case 'review':
      return 'bg-info/15 text-info border-info/20';
    case 'rejected':
      return 'bg-destructive/15 text-destructive border-destructive/20';
    case 'cancelled':
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function formatApplicationDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), 'yyyy/MM/dd HH:mm');
  } catch {
    return isoDate;
  }
}
