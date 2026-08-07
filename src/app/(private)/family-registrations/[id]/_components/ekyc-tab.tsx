'use client';

import Image from 'next/image';

import { formatDateYYYYMM_HHMMSS } from '@/utils/date.util';
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { GetCrmFamilyRegistrationsByIdResponse } from '@/lib/api/types.gen';

type EkycTabProps = {
  ekyc?: GetCrmFamilyRegistrationsByIdResponse['registration']['ekyc'];
};

export function EkycTab({ ekyc }: Readonly<EkycTabProps>) {
  if (!ekyc) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex items-center justify-center p-8 text-sm">
          eKYC検証データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="text-muted-foreground size-4" />
          eKYC検証結果
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
            <span className="text-muted-foreground ml-auto text-xs font-normal">
              検証日時：{formatDateYYYYMM_HHMMSS(ekyc.verified_at)}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 本人確認書類画像 */}
        <div>
          <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            本人確認書類
          </h3>
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-muted flex size-24 items-center justify-center overflow-hidden rounded-lg border">
                {ekyc.face_photo_url ? (
                  <Image
                    src={'https://api.dicebear.com/7.x/avataaars/svg?seed=8'}
                    alt="申込写真"
                    width={96}
                    height={96}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">未取得</span>
                )}
              </div>
              <span className="text-muted-foreground text-xs">顔写真（申請者撮影）</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="bg-muted flex size-24 items-center justify-center overflow-hidden rounded-lg border">
                {ekyc.id_document_url ? (
                  <Image
                    src={'https://api.dicebear.com/7.x/avataaars/svg?seed=6'}
                    alt="本人確認書類"
                    width={96}
                    height={96}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">未取得</span>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                {ekyc.document_type ? `本人確認書類（${ekyc.document_type}）` : '本人確認書類'}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* 顔認証結果 */}
        {ekyc.face_match && (
          <div>
            <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              顔認証結果
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-muted-foreground text-sm font-medium">類似度</label>
                <p className="mt-1 text-2xl font-bold">
                  {ekyc.face_match.similarity}
                  <span className="text-base font-normal">%</span>
                </p>
              </div>
              <div>
                <label className="text-muted-foreground text-sm font-medium">判定</label>
                <div className="mt-1">
                  {ekyc.face_match.passed ? (
                    <Badge className="gap-1 bg-green-100 text-xs text-green-700 hover:bg-green-100">
                      <CheckCircle2 className="size-3" />
                      照合成功
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <XCircle className="size-3" />
                      照合失敗
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ブラックリストチェック */}
        {ekyc.blacklist_check && (
          <>
            <Separator />
            <div>
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                ブラックリストチェック
              </h3>
              <div
                className={`rounded-lg border p-4 ${
                  ekyc.blacklist_check.matched
                    ? 'border-destructive/40 bg-destructive/5'
                    : 'border-green-200 bg-green-50/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {ekyc.blacklist_check.matched ? (
                    <>
                      <AlertTriangle className="text-destructive size-4" />
                      <p className="text-destructive text-sm font-medium">ブラックリスト一致</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 text-green-600" />
                      <p className="text-sm font-medium text-green-700">ブラックリスト未一致</p>
                    </>
                  )}
                </div>
                {ekyc.blacklist_check.matched && ekyc.blacklist_check.reason && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    一致理由：{ekyc.blacklist_check.reason}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
