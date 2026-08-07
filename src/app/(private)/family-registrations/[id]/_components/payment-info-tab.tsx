'use client';

import { Card, CardContent } from '@/components/ui/card';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="text-muted-foreground text-sm font-medium">{label}</label>
      <p className="mt-1 text-sm">{value || '—'}</p>
    </div>
  );
}

export function PaymentInfoTab() {
  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="決済方法" value={null} />
          <InfoRow label="クレジットカード（下4桁）" value={null} />
          <InfoRow label="口座番号（下4桁）" value={null} />
        </div>
      </CardContent>
    </Card>
  );
}
