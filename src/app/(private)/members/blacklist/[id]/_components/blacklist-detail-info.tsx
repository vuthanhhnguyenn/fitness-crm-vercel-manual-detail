'use client';

import { useRouter } from 'next/navigation';

import { formatDatetimeISO } from '@/utils/format.util';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmBlacklistByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BlacklistSourceBadge } from '../../_components/blacklist-source-badge';

type BlacklistDetail = NonNullable<GetCrmBlacklistByIdResponse>['blacklist'];

interface BlacklistDetailInfoProps {
  blacklist: BlacklistDetail;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function BlacklistDetailInfo({ blacklist }: BlacklistDetailInfoProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">登録情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoRow label="会員ID">
            <span className="font-mono text-sm font-medium">{blacklist.memberId}</span>
          </InfoRow>
          <InfoRow label="氏名">
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-medium"
              onClick={() => router.push(navigate('/members/[id]', blacklist.memberId))}
            >
              {blacklist.memberName}
            </Button>
          </InfoRow>
          <InfoRow label="店舗名">
            <span>{blacklist.storeName}</span>
          </InfoRow>
          <InfoRow label="登録理由">
            <div className="flex flex-col gap-1">
              <BlacklistSourceBadge source={blacklist.registrationSource} />
            </div>
          </InfoRow>
          <InfoRow label="登録日時">
            <span>{formatDatetimeISO(blacklist.registeredAt)}</span>
          </InfoRow>
          <InfoRow label="登録者">
            <span>{blacklist.registeredBy}</span>
          </InfoRow>

          <div className="col-span-2">
            <InfoRow label="メモ">
              <span className="text-sm">{blacklist.memo}</span>
            </InfoRow>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
