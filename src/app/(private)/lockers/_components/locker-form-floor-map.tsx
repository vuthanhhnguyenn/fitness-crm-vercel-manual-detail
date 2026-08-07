'use client';

import { useState } from 'react';

import Image from 'next/image';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Lock, Map } from 'lucide-react';

import { getCrmStoresByIdOptions } from '@/lib/api/@tanstack/react-query.gen';

import { StoreFloorMapSvg } from './store-floor-map-svg';

type LockerFormFloorMapProps = {
  storeId: string;
};

export function LockerFormFloorMap({ storeId }: LockerFormFloorMapProps) {
  const [showFloorMap, setShowFloorMap] = useState(false);

  const { data } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: storeId } }),
    enabled: Boolean(storeId),
  });

  const floorMapUrl = data?.store?.floor_map_url;

  return (
    <div className="border-border bg-muted/30 mb-4 overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setShowFloorMap((value) => !value)}
        className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          <Map className="text-muted-foreground size-4" />
          <span className="text-sm font-medium">
            フロアマップを{showFloorMap ? '閉じる' : '確認する'}
          </span>
          <span className="border-border text-muted-foreground inline-flex items-center gap-1 rounded border px-2 py-0 text-[10px]">
            <Lock className="size-3" />
            閲覧専用
          </span>
        </div>
        {showFloorMap ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>
      {showFloorMap && (
        <div className="border-border bg-background border-t p-4">
          <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
            <strong className="text-foreground">Y-02-05 店舗マップ設定</strong>{' '}
            で登録された画像です。エリア記号（A〜N, R,
            S）を参照して下のSelectで選択してください。画像の差し替えはY-02-05側で行います。
          </p>
          <div className="w-full rounded-lg border bg-white p-4">
            {floorMapUrl ? (
              <div className="relative aspect-[700/440] w-full overflow-hidden rounded-lg">
                <Image
                  src={floorMapUrl}
                  alt="店舗フロアマップ（閲覧専用）"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            ) : (
              <StoreFloorMapSvg />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
