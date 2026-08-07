import { AlertTriangle, CheckCircle, User } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';

interface PersonalInfoCardProps {
  record: VisitExperienceDetail;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className="text-sm">{value ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

export function PersonalInfoCard({ record }: PersonalInfoCardProps) {
  const facePhotoRegistered = record.id_document_verified;
  const hasMissingInfo =
    record.status === 'info_missing' && (!record.phone || !record.address || !facePhotoRegistered);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">個人情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4">
        {hasMissingInfo && (
          <Alert className="border-warning/50 bg-warning/10 py-2">
            <AlertTriangle className="text-warning size-4" />
            <AlertDescription className="text-warning text-xs">
              一部の個人情報が未登録です
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-6">
          {/* Face photo placeholder */}
          <div className="flex shrink-0 flex-col gap-2">
            <div
              className={`bg-muted/30 flex size-24 items-center justify-center rounded-full border ${
                !facePhotoRegistered ? 'border-warning/60 bg-warning/10' : 'border-success/40'
              }`}
            >
              <div
                className={`flex flex-col items-center gap-1 ${
                  !facePhotoRegistered ? 'text-warning' : 'text-muted-foreground'
                }`}
              >
                {!facePhotoRegistered ? (
                  <AlertTriangle className="size-6" />
                ) : (
                  <User className="size-6" />
                )}
                <span className="text-center text-[10px]">顔写真</span>
              </div>
            </div>

            {facePhotoRegistered ? (
              <Badge
                variant="outline"
                className="border-success/20 bg-success/15 text-success w-full justify-center gap-1 text-[10px]"
              >
                <CheckCircle className="size-3" />
                登録済み
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-warning/20 bg-warning/15 text-warning w-full justify-center gap-1 text-[10px]"
              >
                <AlertTriangle className="size-3" />
                未登録
              </Badge>
            )}
          </div>

          {/* Fields grid */}
          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4">
            <Field label="氏名" value={record.customer_name} />
            <Field label="フリガナ" value={record.customer_name_kana} />
            <Field label="生年月日" value={record.birth_date} />
            <Field
              label="電話番号"
              value={record.phone ?? <span className="text-warning text-sm">未登録</span>}
            />
            <Field
              label="メールアドレス"
              value={record.email ?? <span className="text-muted-foreground">—</span>}
            />
            <div className="col-span-2">
              <Field
                label="住所"
                value={record.address ?? <span className="text-warning text-sm">未登録</span>}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
