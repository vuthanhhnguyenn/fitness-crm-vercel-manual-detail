'use client';

import { useState } from 'react';

import Image from 'next/image';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLessonContentsByIdResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

type LessonDetail = NonNullable<GetCrmLessonContentsByIdResponse>['data'];
type LessonImage = LessonDetail['images'][number];

interface LessonImageGalleryProps {
  images: LessonImage[];
  lessonName: string;
}

/**
 * Image gallery: main image + caption + counter, prev/next (wraps; arrows only
 * when image count > 1), thumbnail grid with "メイン" marker (FR-003-P1-05).
 */
export function LessonImageGallery({ images, lessonName }: LessonImageGalleryProps) {
  const [mainIndex, setMainIndex] = useState(0);

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">レッスン画像</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted text-muted-foreground flex aspect-[3/2] items-center justify-center rounded-lg text-sm">
            画像はありません
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasMultiple = images.length > 1;
  const current = images[mainIndex];
  const caption = `画像 ${mainIndex + 1}`;

  const goPrev = () => setMainIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const goNext = () => setMainIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">レッスン画像</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {images.length}枚
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main image */}
        <div className="bg-muted relative aspect-[3/2] overflow-hidden rounded-lg">
          <Image
            src={current.url}
            alt={`${lessonName} ${caption}`}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
            priority={mainIndex === 0}
          />
          {/* Caption overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-sm font-medium text-white">{caption}</p>
          </div>
          {/* Counter */}
          <div className="absolute top-3 right-3 rounded bg-black/50 px-2 py-1 text-xs text-white">
            {mainIndex + 1}/{images.length}
          </div>
          {hasMultiple && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="前の画像"
                className="absolute top-1/2 left-2 size-8 -translate-y-1/2 rounded-full bg-black/30 p-0 text-white hover:bg-black/50 hover:text-white"
                onClick={goPrev}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="次の画像"
                className="absolute top-1/2 right-2 size-8 -translate-y-1/2 rounded-full bg-black/30 p-0 text-white hover:bg-black/50 hover:text-white"
                onClick={goNext}
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-6 gap-2">
          {images.map((img, i) => (
            <button
              type="button"
              key={`${img.url}-${i}`}
              onClick={() => setMainIndex(i)}
              aria-label={`サムネイル ${i + 1}`}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                i === mainIndex
                  ? 'border-primary ring-primary ring-1'
                  : 'hover:border-muted-foreground/30 border-transparent',
              )}
            >
              <Image
                src={img.url}
                alt={`${lessonName} サムネイル ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
              {img.order === 1 && (
                <span className="bg-primary text-primary-foreground absolute inset-x-0 bottom-0 py-0.5 text-center text-[9px] font-medium">
                  メイン
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
