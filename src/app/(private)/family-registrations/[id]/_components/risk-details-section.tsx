'use client';

import { useState } from 'react';

import Image from 'next/image';

import { formatDateYYYYMM_HHMMSS } from '@/utils/date.util';
import { getRiskReasonLabelJa } from '@/utils/risk-reason.util';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

type RiskDetailsSectionProps = {
  riskScore: number;
  riskReason: string;
  riskDetails?: Array<{
    reason: string;
    score: number;
    description: string;
  }>;
  ekyc?: {
    verified: boolean;
    verified_at?: string;
    face_photo_url?: string;
    id_document_url?: string;
    document_type?: string;
    face_match?: { similarity: number; passed: boolean };
    blacklist_check?: { matched: boolean; reason?: string };
  };
};

export function FamilyRegistrationRiskDetailsSection({
  riskScore,
  riskReason,
  riskDetails = [],
  ekyc,
}: RiskDetailsSectionProps) {
  const [open, setOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="block">
          <CardHeader className="cursor-pointer select-none">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive size-5" />
              リスク判定詳細
              <Badge variant="destructive" className="ml-1 text-xs font-bold">
                {riskScore}
              </Badge>
              <span className="text-muted-foreground ml-auto text-sm font-normal">
                {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Total Risk Score */}
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">リスクスコア合計</span>
                <span className="text-destructive text-2xl font-bold">{riskScore}</span>
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                理由：{getRiskReasonLabelJa(riskReason)}
              </div>
            </div>

            {/* Risk Factors Breakdown */}
            {riskDetails.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">要素別内訳</h3>
                {riskDetails.map((detail, index) => (
                  <div key={index} className="rounded-lg border">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4"
                      onClick={() => toggleExpand(index)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{getRiskReasonLabelJa(detail.reason)}</span>
                        <span className="text-muted-foreground text-sm">{detail.score}</span>
                      </div>
                      {expandedItems.has(index) ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                    {expandedItems.has(index) && (
                      <div className="bg-muted/30 border-t p-4">
                        <p className="text-muted-foreground text-sm">{detail.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Actions */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="mb-2 font-medium text-amber-900">推奨アクション</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                <li>本人確認書類の再確認</li>
                <li>追加情報の取得</li>
                <li>手動審査の実施</li>
              </ul>
            </div>

            {/* eKYC Section */}
            {ekyc && (
              <>
                <Separator />

                {/* eKYC Header */}
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-muted-foreground size-4" />
                  <span className="text-sm font-semibold">eKYC検証結果</span>
                  {ekyc.verified ? (
                    <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                      <CheckCircle2 className="size-3" />
                      本人確認済
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <XCircle className="size-3" />
                      未確認
                    </Badge>
                  )}
                  {ekyc.verified_at && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      検証日時：{formatDateYYYYMM_HHMMSS(ekyc.verified_at)}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* 顔写真照合結果 */}
                  {ekyc.face_match && (
                    <div className="rounded-lg border p-3">
                      <p className="mb-2 text-xs font-medium">顔写真照合結果</p>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold">
                            {ekyc.face_match.similarity}
                            <span className="text-base font-normal">%</span>
                          </span>
                          <span className="text-muted-foreground text-xs">一致率</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {ekyc.face_match.passed ? (
                            <Badge className="w-fit gap-1 bg-green-100 text-xs text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="size-3" />
                              照合成功
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="w-fit gap-1 text-xs">
                              <XCircle className="size-3" />
                              照合失敗
                            </Badge>
                          )}
                          {ekyc.document_type && (
                            <span className="text-muted-foreground text-xs">
                              書類種別：{ekyc.document_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ブラックリスト情報 */}
                  {ekyc.blacklist_check?.matched && (
                    <div className="border-destructive/40 bg-destructive/5 rounded-lg border p-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="text-destructive size-3.5" />
                        <p className="text-destructive text-xs font-medium">ブラックリスト一致</p>
                      </div>
                      <div className="space-y-1 text-xs">
                        {ekyc.blacklist_check.reason && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-16 shrink-0">一致理由</span>
                            <span className="font-medium">{ekyc.blacklist_check.reason}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-16 shrink-0">登録日</span>
                          <span className="font-medium">
                            {ekyc.verified_at ? formatDateYYYYMM_HHMMSS(ekyc.verified_at) : '—'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-16 shrink-0">旧会員番号</span>
                          <span className="text-muted-foreground font-medium">—</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 比較画像 */}
                {(ekyc.face_photo_url || ekyc.id_document_url) && (
                  <div>
                    <p className="mb-2 text-xs font-medium">比較画像</p>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="bg-muted flex size-24 items-center justify-center overflow-hidden rounded-lg border">
                          {ekyc.face_photo_url ? (
                            <Image
                              src={'https://api.dicebear.com/7.x/avataaars/svg?seed=6'}
                              alt="申込写真"
                              width={96}
                              height={96}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">未取得</span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">申込写真</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="bg-muted flex size-24 items-center justify-center overflow-hidden rounded-lg border">
                          {ekyc.id_document_url ? (
                            <Image
                              src={'https://api.dicebear.com/7.x/avataaars/svg?seed=8'}
                              alt="本人確認書類"
                              width={96}
                              height={96}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">未取得</span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">ブラックリスト写真</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
