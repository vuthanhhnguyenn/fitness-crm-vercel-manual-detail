import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { formatApplicationDate } from './membership-application.utils';

interface ApplicationMetaCardProps {
  app: any;
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
  const applicationDateFormatted = formatApplicationDate(app.application_date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">申請情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-3">
          <Field label="申請ID" value={app.id} mono />
          <Field label="申請日時" value={applicationDateFormatted} />
          <Field label="申請元" value={app.application_source ?? 'アプリ'} />
          <Field label="更新日時" value={app.updated_at ?? '—'} />
          {app.is_proxy && app.proxy_applicant && (
            <Field label="代理申請者" value={app.proxy_applicant} />
          )}
          {app.is_proxy && app.agreement_date && (
            <Field label="合意日時" value={app.agreement_date} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
