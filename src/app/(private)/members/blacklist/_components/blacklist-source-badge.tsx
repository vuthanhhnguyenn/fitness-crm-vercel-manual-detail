import { Badge } from '@/components/ui/badge';

import { BlacklistRegistrationSource } from '@/lib/api/types.gen';

import {
  BLACKLIST_REGISTRATION_SOURCE_LABEL,
  getRegistrationSourceBadgeClass,
} from '../_constants/blacklist.constants';

interface BlacklistSourceBadgeProps {
  source: BlacklistRegistrationSource;
}

export function BlacklistSourceBadge({ source }: BlacklistSourceBadgeProps) {
  return (
    <Badge variant="outline" className={`gap-1.5 ${getRegistrationSourceBadgeClass(source)}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {BLACKLIST_REGISTRATION_SOURCE_LABEL[source]}
    </Badge>
  );
}
