'use client';

import Image from 'next/image';

import { formatDateTime } from '@/utils/format.util';
import { Circle, ImageIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmStoresByIdResponse } from '@/lib/api/types.gen';

import {
  STORE_AREA_LABELS,
  STORE_BRAND_BADGE_CLASSES,
  STORE_BRAND_LABELS,
  STORE_STATUS_BADGE_CLASSES,
  STORE_STATUS_LABELS,
} from '../../../../_constants/constants';

type StoreDetail = GetCrmStoresByIdResponse['store'];

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  const display = value?.trim() ? value : '—';
  return (
    <div className={className}>
      <div className="space-y-1">
        <p className="text-muted-foreground text-[12px] leading-none font-normal">{label}</p>
        <p className="text-foreground text-sm leading-snug font-normal">{display}</p>
      </div>
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href?: string | null }) {
  const url = href?.trim();
  if (!url) {
    return <InfoRow label={label} value={null} />;
  }
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[12px] leading-none font-normal">{label}</p>
      <a
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-sm font-normal underline-offset-4 hover:underline"
      >
        {url}
      </a>
    </div>
  );
}

function ImagePlaceholder() {
  return (
    <div className="bg-muted/50 border-border/80 flex aspect-square w-full items-center justify-center rounded-lg border">
      <ImageIcon className="text-muted-foreground size-6 opacity-70" />
    </div>
  );
}

function ImageEmptySlot() {
  return (
    <div className="border-border/70 aspect-square w-full rounded-lg border border-dashed bg-neutral-100/80" />
  );
}

/**
 * Tab 1 — 基本情報 (read-only) on store detail screen.
 */
export function BasicInfoTab({ store }: { store: StoreDetail }) {
  const photos = store.store_photos ?? [];
  const photoSlots = 5;
  const photoCells = Array.from({ length: photoSlots }, (_, i) => photos[i] ?? null);

  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        {/* Left Column - Main Content */}
        <div className="w-[60%] space-y-5">
          <Card className="border-border bg-card gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader className="border-border/80 gap-0 border-b p-4 pb-2!">
              <CardTitle className="text-[15px] font-semibold tracking-tight">一般情報</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 p-4">
              <InfoRow label="店舗ID" value={store.store_id} />
              <InfoRow label="店舗名" value={store.name} />
              <div className="space-y-1">
                <p className="text-muted-foreground text-[12px] leading-none font-normal">
                  ブランド
                </p>
                <Badge
                  variant="outline"
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${STORE_BRAND_BADGE_CLASSES[store.brand]}`}
                >
                  {STORE_BRAND_LABELS[store.brand]}
                </Badge>
              </div>
              <InfoRow label="運営企業" value={store.operating_company_name} />
              <InfoRow
                label="エリア"
                value={store.area != null ? STORE_AREA_LABELS[store.area] : undefined}
              />
              <InfoRow label="郵便番号" value={store.postal_code} />
              <InfoRow label="都道府県" value={store.prefecture} />
              <InfoRow label="住所" value={store.address} />
              <InfoRow label="メールアドレス" value={store.email} />
              <InfoRow label="電話番号" value={store.phone} />
              <InfoRow label="クラブコード" value={store.club_code} />
              <InfoRow label="会計コード" value={store.accounting_code} />
              <div className="space-y-1">
                <p className="text-muted-foreground text-[12px] leading-none font-normal">
                  FCフラグ
                </p>
                <Badge
                  variant="outline"
                  className="rounded-md border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700"
                >
                  {store.fc_company_id ? 'FC' : '直営'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader className="border-border/80 gap-0 border-b p-4 pb-2!">
              <CardTitle className="text-[15px] font-semibold tracking-tight">ソーシャル</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <LinkRow label="インドアビュー" href={store.interview_url} />
              <LinkRow label="Google Map" href={store.google_map_url} />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <LinkRow label="X（旧Twitter）" href={store.x_url} />
                <LinkRow label="Instagram" href={store.instagram_url} />
                <LinkRow label="LINE" href={store.line_url} />
                <LinkRow label="Facebook" href={store.facebook_url} />
                <LinkRow label="YouTube" href={store.youtube_url} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-[40%] space-y-5">
          <Card className="border-border bg-card gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader className="border-border/80 gap-0 p-4 pb-0">
              <CardTitle className="text-[15px] font-semibold tracking-tight">ステータス</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-[12px] leading-none font-normal">
                  ステータス
                </p>
                <Badge className={`border ${STORE_STATUS_BADGE_CLASSES[store.status]}`}>
                  <span className="inline-flex items-center gap-2">
                    <Circle className="size-2 shrink-0 fill-current" aria-hidden />
                    {STORE_STATUS_LABELS[store.status]}
                  </span>
                </Badge>
              </div>
              <InfoRow label="作成日時" value={formatDateTime(store.created_at)} />
              <InfoRow label="更新日時" value={formatDateTime(store.updated_at)} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader className="border-border/80 gap-0 p-4 pb-0">
              <CardTitle className="text-[15px] font-semibold tracking-tight">店舗写真</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {photoCells.map((src, index) => {
                  if (src) {
                    return (
                      <div
                        key={`${src}-${index}`}
                        className="border-border relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <Image src={src} alt="店舗写真" fill className="object-cover" unoptimized />
                      </div>
                    );
                  }
                  if (photos.length === 0 && index < photoSlots) {
                    return <ImagePlaceholder key={`ph-${index}`} />;
                  }
                  return <ImageEmptySlot key={`empty-${index}`} />;
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card gap-0 rounded-lg py-0 shadow-sm">
            <CardHeader className="border-border/80 gap-0 p-4 pb-0">
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                フロアマップ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {store.floor_map_url ? (
                <div className="border-border relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-lg border">
                  <Image
                    src={store.floor_map_url}
                    alt="フロアマップ"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="border-border relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-lg border">
                  <div className="bg-muted/40 flex h-full min-h-40 items-center justify-center">
                    <ImageIcon className="text-muted-foreground size-8 opacity-70" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
