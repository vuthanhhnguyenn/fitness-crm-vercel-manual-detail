import { UserCheck, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { GetCrmEntryExitLogsResponse } from '@/lib/api/types.gen';

type ActivityRow = GetCrmEntryExitLogsResponse['data'][number];
type FrequencyBadgeType = ActivityRow['frequency_badge'];
type CompanionRole = ActivityRow['companion_role'];

const BADGE_SHARED_CLASS = 'gap-1 px-2 py-0 text-xs font-semibold leading-none cursor-help';

const FREQUENCY_BADGE_CONFIG: Record<
  NonNullable<FrequencyBadgeType>,
  { label: string; description: string }
> = {
  regular: { label: '常連', description: '月10回以上来館している常連会員です。' },
  longAbsence: {
    label: '久しぶり',
    description: '30日以上来館がなかった会員です。お声がけで継続利用を促しましょう。',
  },
};

/** FR-S002 来館頻度バッジ（常連/久しぶり）。Phase 1 では固定値表示のみ（Q&A #3）。 */
export function FrequencyBadge({ type }: { type: NonNullable<FrequencyBadgeType> }) {
  const config = FREQUENCY_BADGE_CONFIG[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Badge
              variant="outline"
              className={`${BADGE_SHARED_CLASS} bg-success/10 text-success border-success/20`}
            />
          }
        >
          {config.label}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
          {config.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const COMPANION_BADGE_CONFIG: Record<
  NonNullable<CompanionRole>,
  { label: string; icon: React.ReactNode; description: string }
> = {
  inviter: {
    label: '招待者',
    icon: <UserPlus className="size-3" />,
    description: 'プレミアムプラン会員として同伴者を招待しています。',
  },
  invitee: {
    label: '同伴者',
    icon: <UserCheck className="size-3" />,
    description: 'プレミアム会員の招待で当日限り入館しているゲスト（C区分）です。',
  },
};

/** FR-M008/M009 同伴招待の視覚識別。判定ロジックはシステム側、ここでは状態表示のみ。 */
export function CompanionBadge({ role }: { role: NonNullable<CompanionRole> }) {
  const config = COMPANION_BADGE_CONFIG[role];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Badge
              variant="outline"
              className={`${BADGE_SHARED_CLASS} bg-info/10 text-info border-info/30 rounded-md`}
            />
          }
        >
          {config.icon}
          {config.label}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
          {config.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
