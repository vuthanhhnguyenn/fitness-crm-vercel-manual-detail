import { Badge } from '@/components/ui/badge';

import type { BlacklistSource } from '@/lib/api/types.gen';

import {
  BLACKLIST_SOURCE_LABEL,
  getBlacklistSourceBadgeClass,
} from '../_constants/blacklist.constants';

interface BlacklistSourceBadgeProps {
  /** The registration-path axis (強制退会 / 手動登録) — not the reason categories. */
  source: BlacklistSource;
}

/** FR-054 — the dot-prefixed badge in the detail header. */
export function BlacklistSourceBadge({ source }: Readonly<BlacklistSourceBadgeProps>) {
  return (
    <Badge variant="outline" className={`gap-1.5 ${getBlacklistSourceBadgeClass(source)}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {BLACKLIST_SOURCE_LABEL[source]}
    </Badge>
  );
}
