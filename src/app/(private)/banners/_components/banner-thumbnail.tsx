'use client';

import { useState } from 'react';

import Image from 'next/image';

import { ImageOff } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BannerThumbnailProps {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function BannerThumbnail({
  src,
  alt,
  width = 120,
  height = 60,
  className,
}: BannerThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex flex-col items-center justify-center rounded-md border text-[10px]',
          className,
        )}
        style={{ width, height }}
      >
        <ImageOff className="mb-0.5 size-3.5" />
        <span>画像なし</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      onError={() => setHasError(true)}
      className={cn('rounded-md border object-cover', className)}
    />
  );
}
