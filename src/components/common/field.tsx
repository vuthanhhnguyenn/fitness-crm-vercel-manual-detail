'use client';

import { Label } from '@/components/ui/label';

export function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value ?? '―'}</span>
    </div>
  );
}
