import { formatDateYYYYMMDD } from '@/utils/date.util';
import { Eye, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmTermsByIdResponse } from '@/lib/api/types.gen';

import { TERMS_STATUS_LABELS, TERMS_TYPE_LABELS } from '../../_constants/constants';

type BasicInfoTermDetailProps = {
  readonly detail: GetCrmTermsByIdResponse;
};

function getStatusBadgeClass(status: GetCrmTermsByIdResponse['status']) {
  switch (status) {
    case 'published':
      return 'bg-success/15 text-success border-success/20';
    case 'expired':
      return 'border-border bg-muted text-muted-foreground';
    case 'draft':
      return 'bg-warning/15 text-warning border-warning/20';
  }
}

function Field({
  label,
  value,
}: Readonly<{
  label: string;
  value: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function BasicInfoTermDetail({ detail }: BasicInfoTermDetailProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-[60%]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4">
            <Field label="規約名" value={detail.title} />
            <Field label="備考" value={detail.remarks || '-'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              規約本文
              <Badge variant="secondary" className="text-[10px]">
                {detail.currentVersion} 適用中
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4">
            <p className="text-muted-foreground text-xs">
              PDFはモバイルアプリで会員に配信されます。CRM
              側ではテキスト本文で内容確認できます（Y-04 検討-01 方式D）
            </p>
            <div className="bg-muted/30 max-h-[320px] overflow-y-auto rounded-md border p-4">
              <pre className="font-sans text-xs leading-relaxed whitespace-pre-wrap">
                {detail.bodyText || '本文が登録されていません'}
              </pre>
            </div>

            <div className="bg-background flex w-fit items-center gap-2 rounded-md border px-3 py-2">
              <FileText className="text-muted-foreground size-4" />
              <a
                href={detail.currentFile.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-xs hover:underline"
              >
                {detail.currentFile.name}
              </a>
              <span className="text-muted-foreground text-[10px]">({detail.currentFile.size})</span>
              <Button variant="outline" size="sm" className="ml-2 h-7 gap-1 text-[10px]">
                <Eye className="size-3" />
                プレビュー
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base font-semibold">管理情報</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-4">
              <Field
                label="ステータス"
                value={
                  <Badge
                    variant="outline"
                    className={`gap-1 text-xs ${getStatusBadgeClass(detail.status)}`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {TERMS_STATUS_LABELS[detail.status]}
                  </Badge>
                }
              />
              <Field
                label="適用中バージョン"
                value={<Badge variant="secondary">{detail.currentVersion}</Badge>}
              />
              <Field label="規約ID" value={detail.id} />
              <Field label="承諾ボタン表示" value={detail.requiresConsent ? 'オン' : 'オフ'} />
              <Field label="規約タイプ" value={TERMS_TYPE_LABELS[detail.termsType]} />
              <Field
                label="ブランド"
                value={
                  <Badge variant="outline" className="text-[10px]">
                    {detail.brandEnum}
                  </Badge>
                }
              />
              <Field label="適用開始日" value={formatDateYYYYMMDD(detail.effectiveFrom, '-')} />
              {detail.effectiveTo && (
                <Field label="適用終了日" value={formatDateYYYYMMDD(detail.effectiveTo, '-')} />
              )}
              <Field label="表示順" value={detail.displayOrder ?? '-'} />

              <div className="border-t pt-4">
                <div className="flex flex-col gap-4">
                  <Field label="作成日時" value={detail.createdAt} />
                  <Field label="作成者" value={detail.createdBy || '-'} />
                  <Field label="最終更新日時" value={detail.updatedAt} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
