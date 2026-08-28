'use client';

import { useState } from 'react';

import Image from 'next/image';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { ChevronLeft, ChevronRight, Dumbbell, ListChecks } from 'lucide-react';

import { StatusCard } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { RoutineDetail } from '@/lib/api/types.gen';

import {
  ROUTINE_PUBLISH_STATUS_LABELS,
  getRoutinePublishStatusBadgeClass,
  getRoutinePublishStatusDotClass,
} from '../../_constants/routine.constants';

function ThumbnailGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-muted flex aspect-video flex-col items-center justify-center gap-2 rounded-md">
        <Dumbbell className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-xs">サムネイル未登録</p>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, images.length - 1);

  return (
    <div className="space-y-2">
      <div className="bg-muted relative aspect-video max-h-[280px] overflow-hidden rounded-md">
        <Image
          src={images[safeIndex]!}
          alt={`ルーティン写真 ${safeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex((safeIndex - 1 + images.length) % images.length)}
              className="bg-background/80 hover:bg-background absolute top-1/2 left-2 size-8 -translate-y-1/2 rounded-full"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex((safeIndex + 1) % images.length)}
              className="bg-background/80 hover:bg-background absolute top-1/2 right-2 size-8 -translate-y-1/2 rounded-full"
            >
              <ChevronRight className="size-4" />
            </Button>
            <div className="bg-background/80 absolute right-2 bottom-2 rounded-sm px-2 py-1">
              <p className="text-xs font-medium">
                {safeIndex + 1} / {images.length}
              </p>
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`relative size-12 overflow-hidden rounded-sm border-2 ${
                index === safeIndex
                  ? 'border-primary'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={image}
                alt={`サムネイル ${index + 1}`}
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RoutineBasicInfoTab({ routine }: { routine: RoutineDetail }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-col gap-4 lg:w-[60%]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="mb-4">
              <h2 className="text-base font-bold">{routine.name}</h2>
              {routine.description && (
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {routine.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">ルーティンカテゴリ</p>
                <Badge variant="secondary" className="text-xs font-normal">
                  {routine.categoryName}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">エクササイズ数</p>
                <p className="text-sm font-medium">{routine.exerciseCount}種目</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">ステータス</p>
                <Badge
                  variant="outline"
                  className={`gap-1 text-xs font-medium ${getRoutinePublishStatusBadgeClass(routine.publishStatus)}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${getRoutinePublishStatusDotClass(routine.publishStatus)}`}
                  />
                  {ROUTINE_PUBLISH_STATUS_LABELS[routine.publishStatus]}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">最終更新日</p>
                <p className="text-sm font-medium">{formatDateYYYYMMDD(routine.updatedAt, '—')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">更新者</p>
                <p className="text-sm font-medium">{routine.updatedByName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <StatusCard
            tone={routine.publishStatus === 'published' ? 'success' : 'muted'}
            icon={ListChecks}
            label={ROUTINE_PUBLISH_STATUS_LABELS[routine.publishStatus]}
            meta={`最終更新: ${formatDateYYYYMMDD(routine.updatedAt, '—')}`}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">サムネイル</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ThumbnailGallery images={routine.thumbnailS3Keys} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
