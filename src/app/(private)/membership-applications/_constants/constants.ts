import type { MembershipApplicationStatus } from '@/types/api/membership-application.type';

export const STATUS_BADGE_CLASSES: Record<MembershipApplicationStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/20',
  review: 'bg-info/15 text-info border-info/20',
  approved: 'bg-success/15 text-success border-success/20',
  rejected: 'bg-destructive/15 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export const STATUS_OPTIONS: { label: string; value: MembershipApplicationStatus | '' }[] = [
  { label: '全ステータス', value: '' },
  { label: '未審査', value: 'pending' },
  { label: '審査中', value: 'review' },
  { label: '承認済', value: 'approved' },
  { label: '否認', value: 'rejected' },
  { label: '取り消し済', value: 'cancelled' },
];

export const BRAND_OPTIONS = [
  { label: '全ブランド', value: '' },
  { label: 'FIT365', value: 'FIT365' },
  { label: 'JOYFIT', value: 'JOYFIT' },
];

export const BLACKLIST_OPTIONS = [
  { label: '全申請', value: 'all' as const },
  { label: 'BL一致のみ', value: 'match' as const },
  { label: 'BL一致なし', value: 'no_match' as const },
];

export const IN_QUEUE_STATUSES: MembershipApplicationStatus[] = ['pending', 'review'];
