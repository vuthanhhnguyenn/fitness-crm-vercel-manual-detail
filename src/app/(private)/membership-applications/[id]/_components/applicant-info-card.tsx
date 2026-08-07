'use client';

import { useState } from 'react';

import { Eye, EyeOff, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ApplicantInfoCardProps {
  app: any;
}

function Field({
  label,
  value,
  mono,
}: Readonly<{ label: string; value: React.ReactNode; mono?: boolean }>) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
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
  forceVisible?: boolean;
}>) {
  const [individualVisible, setIndividualVisible] = useState(false);
  const visible = forceVisible || individualVisible;
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{visible ? realValue : maskedValue}</span>
        {!forceVisible && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 gap-1 px-2 text-xs"
            onClick={() => setIndividualVisible(!individualVisible)}
          >
            {individualVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            {individualVisible ? '非表示' : '表示'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ApplicantInfoCard({ app }: Readonly<ApplicantInfoCardProps>) {
  const [allPersonalVisible, setAllPersonalVisible] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">申請者情報</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1 text-xs"
          onClick={() => setAllPersonalVisible(!allPersonalVisible)}
        >
          {allPersonalVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          {allPersonalVisible ? '個人情報を隠す' : '個人情報を表示する'}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4">
        {/* 顔写真 + 基本情報 */}
        <div className="flex gap-4">
          <div className="bg-muted/30 flex h-24 w-24 shrink-0 items-center justify-center rounded-md border">
            <div className="text-muted-foreground flex flex-col items-center gap-1">
              <User className="size-6" />
              <span className="text-[10px]">未設定</span>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4">
            <Field label="氏名" value={app.applicant_name} />
            <Field label="フリガナ" value={app.applicant_kana ?? '—'} />
            <Field label="生年月日" value={`${app.birth_date ?? '—'}（${app.age ?? 0}歳）`} />
            <Field label="性別" value={app.gender_label ?? '—'} />
          </div>
        </div>
        {/* 連絡先・住所 */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <MaskedField
            label="電話番号"
            maskedValue={app.phone ?? '—'}
            realValue={app.phone_real ?? '—'}
            forceVisible={allPersonalVisible}
          />
          <MaskedField
            label="メールアドレス"
            maskedValue={app.email_masked ?? '—'}
            realValue={app.email_real ?? '—'}
            forceVisible={allPersonalVisible}
          />
          <div className="col-span-2">
            <MaskedField
              label="住所"
              maskedValue={app.address ?? '—'}
              realValue={app.address_real ?? '—'}
              forceVisible={allPersonalVisible}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
