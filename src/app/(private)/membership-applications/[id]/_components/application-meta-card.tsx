import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { ENROLLMENT_ROUTE_LABELS } from '../../_constants/constants';
import { formatApplicationDate } from './membership-application.utils';
import type { ApplicationDetail } from './membership-application.utils';

interface ApplicationMetaCardProps {
  app: ApplicationDetail;
}

function Field({ label, value, mono }: Readonly<{ label: string; value: string; mono?: boolean }>) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export function ApplicationMetaCard({ app }: Readonly<ApplicationMetaCardProps>) {
  const isProxy = app.application_source === '管理画面';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">申請情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-3">
          <Field label="申請ID" value={app.id} mono />
          <Field label="申請日時" value={formatApplicationDate(app.application_date)} />
          <Field label="申請元" value={app.application_source} />
          <Field label="入会経路" value={ENROLLMENT_ROUTE_LABELS[app.enrollment_route]} />
          <Field label="更新日時" value={formatDateYYYYMMDD_HHMM(app.updated_at, '—')} />
          {isProxy && app.proxy_staff_name && (
            <Field label="代理申請者" value={app.proxy_staff_name} />
          )}
          {isProxy && app.agreement_datetime && (
            <Field label="合意日時" value={formatDateYYYYMMDD_HHMM(app.agreement_datetime, '—')} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
