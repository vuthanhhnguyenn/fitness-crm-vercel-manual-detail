import type { ReactNode } from 'react';

import { OptionalMark, RequiredMark } from '@/components/common/field-marker';
import { FormLabel } from '@/components/ui/form';

interface CampaignFieldLabelProps {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

/** 必須／任意マークは共通の field-marker を使う (V0 の RequiredMark / OptionalMark と同義)。 */
export function CampaignFieldLabel({
  children,
  required,
  optional,
  className,
}: Readonly<CampaignFieldLabelProps>) {
  return (
    <FormLabel className={className}>
      {children}
      {required && <RequiredMark />}
      {optional && <OptionalMark />}
    </FormLabel>
  );
}
