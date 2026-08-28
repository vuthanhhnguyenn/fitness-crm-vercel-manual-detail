'use client';

import { useState } from 'react';

import Image from 'next/image';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmExercisesByIdResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

type ExerciseDetail = NonNullable<GetCrmExercisesByIdResponse>['exercise'];

interface ExerciseImageGalleryProps {
  images: ExerciseDetail['images'];
  exerciseName: string;
}

export function ExerciseImageGallery({ images, exerciseName }: ExerciseImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const primaryIndex = images.findIndex((image) => image.isPrimary);
    return primaryIndex === -1 ? 0 : primaryIndex;
  });

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">サムネイル画像</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted text-muted-foreground flex aspect-[4/3] items-center justify-center rounded-lg text-sm">
            画像はありません
          </div>
        </CardContent>
      </Card>
    );
  }

  const current = images[activeIndex]!;
  const hasMultiple = images.length > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">サムネイル画像</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {images.length}枚
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg">
          <Image
            src={current.url}
            alt={`${exerciseName} ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
          />
          {hasMultiple && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="border-border bg-background/80 text-foreground hover:bg-background hover:text-foreground absolute top-1/2 left-2 size-8 -translate-y-1/2 rounded-full border p-0 shadow-sm"
                onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="border-border bg-background/80 text-foreground hover:bg-background hover:text-foreground absolute top-1/2 right-2 size-8 -translate-y-1/2 rounded-full border p-0 shadow-sm"
                onClick={() => setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
          <div className="bg-background/80 text-foreground absolute right-3 bottom-3 rounded px-2 py-1 text-xs shadow-sm">
            {activeIndex + 1}/{images.length}
          </div>
        </div>

        {hasMultiple && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((image: ExerciseDetail['images'][number], index: number) => (
              <button
                type="button"
                key={image.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-md border-2 transition-colors',
                  activeIndex === index
                    ? 'border-primary'
                    : 'hover:border-border border-transparent',
                )}
              >
                <Image
                  src={image.url}
                  alt={`${exerciseName} サムネイル ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
