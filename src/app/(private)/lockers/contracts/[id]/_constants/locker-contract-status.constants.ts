import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

import { LockerContractStatus } from '@/lib/api/types.gen';

export const LOCKER_CONTRACT_STATUS_BADGE_MAP: Record<
  LockerContractStatus,
  { className: string; dotClassName: string; label: string }
> = {
  [LockerContractStatus.IN_USE]: {
    className: 'border-success/20 bg-success/15 text-success gap-1 text-xs font-medium',
    dotClassName: 'bg-success',
    label: '利用中',
  },
  [LockerContractStatus.PENDING_RELEASE]: {
    className: 'border-warning/20 bg-warning/15 text-warning gap-1 text-xs font-medium',
    dotClassName: 'bg-warning',
    label: '開放待ち',
  },
  [LockerContractStatus.AVAILABLE]: {
    className: 'border-muted bg-muted/50 text-muted-foreground gap-1 text-xs font-medium',
    dotClassName: 'bg-muted-foreground',
    label: '利用可能',
  },
};

export const LOCKER_CONTRACT_STATUS_CARD_MAP: Record<
  LockerContractStatus,
  { tone: 'success' | 'warning' | 'muted'; icon: typeof CheckCircle2; label: string }
> = {
  [LockerContractStatus.IN_USE]: {
    tone: 'success',
    icon: CheckCircle2,
    label: '利用中',
  },
  [LockerContractStatus.PENDING_RELEASE]: {
    tone: 'warning',
    icon: Clock3,
    label: '開放待ち',
  },
  [LockerContractStatus.AVAILABLE]: {
    tone: 'muted',
    icon: XCircle,
    label: '利用可能',
  },
};
