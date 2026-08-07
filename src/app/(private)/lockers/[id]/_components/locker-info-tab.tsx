'use client';

import Image from 'next/image';

import { formatDateYYYYMMDD } from '@/utils/date.util';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';

import { LOCKER_OPTION_TYPE_LABELS, LOCKER_SHAPE_LABELS } from '../../_constants/constants';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

interface LockerInfoTabProps {
  locker: LockerDetail;
}

export function LockerInfoTab({ locker }: LockerInfoTabProps) {
  const bottomRowSlots = locker.slot_items.filter((slot) => slot.is_bottom_row);
  const configuredBottomFees = locker.slot_items.filter(
    (slot) => slot.is_bottom_row && slot.individual_fee !== null,
  );
  const bottomRowInUseCount = bottomRowSlots.filter((slot) => slot.status === 'in_use').length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ロッカー情報</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs">ロッカーID</p>
              <p className="text-sm font-medium">{locker.locker_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">店舗</p>
              <p className="text-sm font-medium">{locker.store_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">エリア</p>
              <p className="text-sm font-medium">{locker.area}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">形状</p>
              <p className="text-sm font-medium">{LOCKER_SHAPE_LABELS[locker.shape]}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">オプション契約</p>
              <Badge variant="secondary" className="mt-1 text-xs font-normal">
                {locker.option_contract_master?.name ??
                  LOCKER_OPTION_TYPE_LABELS[locker.option_type]}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">契約形態コード</p>
              <p className="font-mono text-sm font-medium">{locker.contract_type_code ?? '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-xs">ナンバリングパターン</p>
              <p className="text-sm font-medium">{locker.numbering_pattern}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-xs">案内文</p>
              <p className="text-sm">{locker.guide_text ?? '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-xs">補足説明</p>
              <p className="text-sm">{locker.note ?? '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-xs">最下段個別会費</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-info/15 text-info border-info/20 text-xs font-medium"
                >
                  利用中の最下段 {bottomRowInUseCount}/{bottomRowSlots.length}枠
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-success/15 text-success border-success/20 text-xs font-medium"
                >
                  個別会費設定済み {configuredBottomFees.length}件
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {configuredBottomFees.length > 0 ? (
                  configuredBottomFees.map((slot) => (
                    <Badge key={slot.id} variant="outline" className="text-xs font-normal">
                      {slot.slot_number}: ¥{slot.individual_fee?.toLocaleString()}/月
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">設定なし</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">写真・外観</CardTitle>
          </CardHeader>
          <CardContent>
            {locker.image_url ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                <Image
                  src={locker.image_url}
                  alt={locker.locker_id}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-muted-foreground flex h-56 items-center justify-center rounded-lg border border-dashed text-sm">
                画像は未登録です
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">スロットサマリー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">総スロット数</span>
              <span className="font-semibold">{locker.summary.total_slots}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">利用可能</span>
              <span className="text-success font-semibold">{locker.summary.available_slots}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">利用中</span>
              <span className="text-info font-semibold">{locker.summary.in_use_slots}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">開放待ち</span>
              <span className="text-warning font-semibold">
                {locker.summary.pending_release_slots}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground">稼働率</span>
              <span className="font-semibold">{locker.summary.utilization_rate_percent}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">その他情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">作成日時</p>
              <p>{formatDateYYYYMMDD(locker.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">更新日時</p>
              <p>{formatDateYYYYMMDD(locker.updated_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
