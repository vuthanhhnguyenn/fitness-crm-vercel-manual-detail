import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface ReservationInfoCardProps {
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

export function ReservationInfoCard({ record }: ReservationInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">来店詳細情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <Field label="店舗" value={record.store_name} />
        <Field label="来店予定日時" value={formatDateYYYYMMDD_HHMM(record.reserved_at)} />
        {record.permit_issued_at && (
          <Field
            label="見学許可発行日時"
            value={formatDateYYYYMMDD_HHMM(record.permit_issued_at)}
          />
        )}
        {record.visit_end_actual_at && (
          <Field label="見学終了日時" value={formatDateYYYYMMDD_HHMM(record.visit_end_actual_at)} />
        )}
        {record.enrolled_at && (
          <Field label="入会申請日時" value={formatDateYYYYMMDD_HHMM(record.enrolled_at)} />
        )}
        {record.cancelled_at && (
          <Field label="キャンセル日時" value={formatDateYYYYMMDD_HHMM(record.cancelled_at)} />
        )}
      </CardContent>
    </Card>
  );
}
