'use client';
// Holds local reveal/mask toggle state — client-only.
import { useState } from 'react';

import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { AlertTriangle, CheckCircle, Eye, EyeOff, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import type { ApplicationDetail } from './membership-application.utils';

interface ApplicantInfoCardProps {
  app: ApplicationDetail;
}

function Field({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function MaskedField({
  label,
  maskedValue,
  realValue,
  forceVisible,
}: Readonly<{
  label: string;
  maskedValue: string;
  realValue: string;
  forceVisible: boolean;
}>) {
  const [individualVisible, setIndividualVisible] = useState(false);
  const visible = forceVisible || individualVisible;
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <span className="flex-1 font-mono text-sm">{visible ? realValue : maskedValue}</span>
        {!forceVisible && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground size-6 shrink-0 p-0"
            onClick={() => setIndividualVisible((v) => !v)}
            aria-label={individualVisible ? `${label}を隠す` : `${label}を表示する`}
          >
            {individualVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ApplicantInfoCard({ app }: Readonly<ApplicantInfoCardProps>) {
  const [allRevealed, setAllRevealed] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">申請者情報</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setAllRevealed((v) => !v)}
        >
          {allRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {allRevealed ? '個人情報を隠す' : '個人情報を表示'}
        </Button>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex gap-6">
          <div className="flex shrink-0 flex-col gap-2">
            <div
              className={`bg-muted/30 flex size-24 items-center justify-center rounded-full border ${app.face_photo_registered ? 'border-success/40' : ''}`}
            >
              <div className="text-muted-foreground flex flex-col items-center gap-1">
                <User className="size-6" />
                <span className="text-[10px]">顔写真</span>
              </div>
            </div>
            {app.face_photo_registered ? (
              <Badge
                variant="outline"
                className="bg-success/15 text-success border-success/20 w-full justify-center gap-1 text-[10px]"
              >
                <CheckCircle className="size-3" />
                登録済み
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-warning/15 text-warning border-warning/20 w-full justify-center gap-1 text-[10px]"
              >
                <AlertTriangle className="size-3" />
                未登録
              </Badge>
            )}
            {app.face_photo_registered && app.face_photo_registered_at && (
              <span className="text-muted-foreground text-center text-[10px]">
                {formatDateYYYYMMDD_HHMM(app.face_photo_registered_at)}
              </span>
            )}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4">
            <Field label="氏名" value={app.applicant_name} />
            <Field label="フリガナ" value={app.applicant_kana} />
            <Field
              label="生年月日"
              value={`${formatDateYYYYMMDD(app.birth_date)}（${app.age}歳）`}
            />
            <Field label="性別" value={app.gender_label} />
            <MaskedField
              label="電話番号"
              maskedValue={app.phone_masked}
              realValue={app.phone_real}
              forceVisible={allRevealed}
            />
            <MaskedField
              label="メールアドレス"
              maskedValue={app.email_masked}
              realValue={app.email_real}
              forceVisible={allRevealed}
            />
            <div className="col-span-2">
              <MaskedField
                label="住所"
                maskedValue={app.address_masked}
                realValue={app.address_real}
                forceVisible={allRevealed}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
