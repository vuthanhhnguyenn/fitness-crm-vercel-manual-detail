import { Badge } from '@/components/ui/badge';

import { Brand } from '@/lib/api/types.gen';

export const BRAND_LABELS: Record<Brand, string> = {
  [Brand.JOYFIT]: 'JOYFIT',
  [Brand.FIT365]: 'FIT365',
  [Brand.JOYFIT_PLUS]: 'JOYFIT+',
  [Brand.JOYFIT_YOGA]: 'JOYFIT YOGA',
  [Brand.JOYFIT24]: 'JOYFIT24',
};

export const BRAND_COLOR_MAP: Record<Brand, string> = {
  [Brand.JOYFIT]: 'primary',
  [Brand.FIT365]: 'destructive',
  [Brand.JOYFIT_PLUS]: 'warning',
  [Brand.JOYFIT_YOGA]: 'success',
  [Brand.JOYFIT24]: 'info',
};

interface BrandBadgeProps {
  brand: Brand;
  className?: string;
}
export function BrandBadge({ brand, className = '' }: BrandBadgeProps) {
  const token = BRAND_COLOR_MAP[brand];
  const badgeClass = token
    ? `bg-${token}/15 text-${token} border-${token}/20`
    : 'bg-muted text-muted-foreground border-border';
  return (
    <Badge variant="outline" className={`text-[10px] ${badgeClass} ${className}`}>
      {BRAND_LABELS[brand]}
    </Badge>
  );
}
