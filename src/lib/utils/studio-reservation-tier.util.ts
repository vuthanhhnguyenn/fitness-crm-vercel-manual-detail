import type { ReservationTier } from '@/app/api/_schemas/studio-detail.schema';

/**
 * Maps reservation rate percentage to reservation tier.
 * Used for color-coded threshold display in linked lessons.
 *
 * Thresholds:
 * - >= 80: success (green)
 * - >= 60 && < 80: warning (amber)
 * - < 60: default (slate)
 */
export function mapReservationRateToTier(rate: number): ReservationTier {
  if (rate >= 80) {
    return 'success';
  } else if (rate >= 60) {
    return 'warning';
  }
  return 'default';
}

/**
 * Gets color classes for a reservation tier.
 */
export function getTierColorClasses(tier: ReservationTier) {
  const styles = {
    success: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      bar: 'bg-green-500',
    },
    warning: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      bar: 'bg-amber-500',
    },
    default: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      bar: 'bg-slate-400',
    },
  };

  return styles[tier];
}

/**
 * Gets label for a reservation tier.
 */
export function getTierLabel(tier: ReservationTier): string {
  const labels = {
    success: '利用率高い',
    warning: '利用率中',
    default: '利用率低い',
  };

  return labels[tier];
}
