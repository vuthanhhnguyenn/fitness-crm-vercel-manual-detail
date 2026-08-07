import { Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface ReservationInfoCardProps {
  record: VisitExperienceDetail;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function ReservationInfoCard({ record }: ReservationInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="size-4" />
          来店詳細情報
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <Field label="来店予定日時" value={formatDateTime(record.reserved_at)} />
        {record.permit_issued_at && (
          <Field label="見学許可発行日時" value={formatDateTime(record.permit_issued_at)} />
        )}
        {record.visit_end_actual_at && (
          <Field label="見学終了日時" value={formatDateTime(record.visit_end_actual_at)} />
        )}
      </CardContent>
    </Card>
  );
}
