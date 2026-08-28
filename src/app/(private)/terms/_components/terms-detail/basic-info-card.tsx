'use client';

import { formatFileSize } from '@/utils/format.util';
import { Eye, FileText } from 'lucide-react';

import { Field } from '@/components/common/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { TermsDetailResponse } from '@/lib/api/types.gen';

interface BasicInfoCardProps {
  terms: TermsDetailResponse;
}

export function BasicInfoCard({ terms }: Readonly<BasicInfoCardProps>) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-4">
            <Field label="規約名" value={terms.title} />
            <Field label="備考" value={terms.remarks} />
          </div>
        </CardContent>
      </Card>

      {terms.isCurrentlyApplied && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              規約本文
              <Badge variant="secondary" className="text-[10px]">
                {terms.version} 適用中
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-xs">
                PDFはモバイルアプリで会員に配信されます。CRM
                側ではテキスト本文で内容確認できます（Y-04 検討-01 方式D）
              </p>
              <div className="bg-muted/30 max-h-[320px] overflow-y-auto rounded-md border p-4">
                <pre className="font-sans text-xs leading-relaxed whitespace-pre-wrap">
                  {terms.bodyText}
                </pre>
              </div>
              <div className="bg-background flex w-fit items-center gap-2 rounded-md border px-3 py-2">
                <FileText className="text-muted-foreground size-4" />
                <a
                  href={terms.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-xs hover:underline"
                >
                  {terms.pdfFileName}
                </a>
                <span className="text-muted-foreground text-[10px]">
                  ({formatFileSize(terms.pdfFileSize)})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 h-7 gap-1 text-[10px]"
                  onClick={() => window.open(terms.pdfUrl, '_blank', 'noopener,noreferrer')}
                >
                  <Eye className="size-3" />
                  プレビュー
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
