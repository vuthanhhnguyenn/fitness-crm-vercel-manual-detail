import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface B01InfoCardProps {
  record: VisitExperienceDetail;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function B01InfoCard({ record }: B01InfoCardProps) {
  if (!record.b01_entry_at) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">入退館連携情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <Field label="認証方式" value={record.b01_auth_method ?? '—'} />
        <Field label="許可ゲート" value={record.b01_gate ?? '—'} />
        <Field label="入館時刻" value={formatDateYYYYMMDD_HHMM(record.b01_entry_at)} />
        {(record.status === 'visit_completed' || record.status === 'membership_applied') && (
          <Field label="退館時刻" value={formatDateYYYYMMDD_HHMM(record.b01_exit_at)} />
        )}
      </CardContent>
    </Card>
  );
}
