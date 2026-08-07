'use client';

import Link from 'next/link';

import { format, parseISO } from 'date-fns';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmTransfersByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

type TransferDetail = NonNullable<GetCrmTransfersByIdResponse>['transfer'];

const BRAND_CLASSES: Record<TransferDetail['brand'], string> = {
  joyfit: 'bg-info/15 text-info border-info/20',
  fit365: 'bg-warning/15 text-warning border-warning/20',
};

const BRAND_LABELS: Record<TransferDetail['brand'], string> = {
  joyfit: 'JOYFIT',
  fit365: 'FIT365',
};

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function formatJST(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'yyyy/MM/dd HH:mm');
  } catch {
    return dateStr;
  }
}

export function TransferDetailInfo({ transfer }: Readonly<{ transfer: TransferDetail }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">移籍情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="申請ID">
            <span className="font-mono">{transfer.id}</span>
          </Field>

          <Field label="会員名">
            <div className="flex items-center gap-1">
              <Button
                nativeButton={false}
                variant="link"
                className="h-auto p-0 text-sm font-medium"
                render={<Link href={navigate('/members/[id]', transfer.member_id)} />}
              >
                {transfer.member_name}
              </Button>
              <ArrowRight className="text-muted-foreground size-3" />
            </div>
          </Field>

          <Field label="移籍元店舗">{transfer.from_store_name}</Field>

          <Field label="移籍先店舗">{transfer.to_store_name}</Field>

          <div className="col-span-2">
            <Field label="移籍理由">{transfer.reason}</Field>
          </div>

          <Field label="移籍希望日">{formatJST(transfer.scheduled_date)}</Field>

          <Field label="ブランド">
            <Badge
              variant="outline"
              className={cn('text-xs font-medium', BRAND_CLASSES[transfer.brand])}
            >
              {BRAND_LABELS[transfer.brand]}
            </Badge>
          </Field>

          <Field label="申請者">
            {transfer.applicant_name}
            <span className="text-muted-foreground ml-1 text-xs">({transfer.applicant_role})</span>
          </Field>

          <Field label="申請日時">{formatJST(transfer.applied_at)}</Field>
        </div>
      </CardContent>
    </Card>
  );
}
