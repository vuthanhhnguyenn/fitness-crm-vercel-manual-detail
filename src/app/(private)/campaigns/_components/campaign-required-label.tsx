import { FormLabel } from '@/components/ui/form';

interface CampaignRequiredLabelProps {
  children: string;
}

export function CampaignRequiredLabel({ children }: Readonly<CampaignRequiredLabelProps>) {
  return (
    <FormLabel>
      {children}
      <span className="text-destructive ml-0.5">*</span>
    </FormLabel>
  );
}
