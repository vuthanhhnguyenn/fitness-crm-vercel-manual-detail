'use client';

import { OptionalMark, RequiredMark } from '@/components/common/field-marker';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  description?: string;
  error?: string;
}

export function FormField({
  label,
  required,
  optional,
  children,
  description,
  error,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <Label className="text-sm">
          {label}
          {required && <RequiredMark />}
          {optional && <OptionalMark />}
        </Label>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      {children}
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  );
}
