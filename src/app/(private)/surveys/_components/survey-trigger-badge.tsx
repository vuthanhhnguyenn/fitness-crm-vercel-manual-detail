'use client';

import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';

import { SURVEY_TRIGGER_LABELS } from '../_constants/constants';

interface SurveyTriggerBadgeProps {
  trigger: keyof typeof SURVEY_TRIGGER_LABELS;
  className?: string;
}

export function SurveyTriggerBadge({ trigger, className }: SurveyTriggerBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-border bg-background h-6 rounded-full px-3 text-[10px] font-normal shadow-sm',
        className,
      )}
    >
      {SURVEY_TRIGGER_LABELS[trigger]}
    </Badge>
  );
}
