'use client';

import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { useImageUpload } from '@/hooks/use-image-upload.hook';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type { RoutineFormValues } from '../../_schemas/routine-form.schema';

const MAX_THUMBNAILS = 5;

export function RoutineFormThumbnailSection() {
  const form = useFormContext<RoutineFormValues>();
  const value = useWatch({ control: form.control, name: 'thumbnailS3Keys' });
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading } = useImageUpload({ category: 'other' });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_THUMBNAILS - value.length;
    const selected = Array.from(files).slice(0, remaining);
    const urls = await uploadFiles(selected);
    if (urls.length > 0) {
      const current = form.getValues('thumbnailS3Keys');
      form.setValue('thumbnailS3Keys', [...current, ...urls].slice(0, MAX_THUMBNAILS), {
        shouldDirty: true,
      });
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (index: number) => {
    form.setValue(
      'thumbnailS3Keys',
      value.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  return (
    <Card>
      <CardContent className="px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
            2
          </div>
          <h3 className="text-sm font-bold">サムネイル画像</h3>
        </div>
        <p className="text-muted-foreground mb-3 text-xs">
          最大{MAX_THUMBNAILS}枚まで登録できます。1枚目がメイン画像として使用されます。
        </p>

        <div className="space-y-3">
          {value.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {value.map((url, index) => (
                <div key={url} className="group relative">
                  <div className="relative size-24 overflow-hidden rounded-md">
                    <Image
                      src={url}
                      alt={`サムネイル ${index + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <span className="bg-primary text-primary-foreground absolute top-1 left-1 rounded px-1 text-[10px]">
                      メイン
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="bg-background/80 absolute top-1 right-1 size-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => removeAt(index)}
                  >
                    <Trash2 className="text-destructive size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {value.length < MAX_THUMBNAILS && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleFiles(event.dataTransfer.files);
              }}
              className="border-border hover:border-primary/50 hover:bg-muted/30 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="text-muted-foreground size-8 animate-spin" />
              ) : (
                <ImagePlus className="text-muted-foreground size-8" />
              )}
              <p className="text-muted-foreground text-sm">
                {isUploading ? 'アップロード中...' : 'クリックまたはドラッグでアップロード'}
              </p>
              <p className="text-muted-foreground text-xs">JPG・PNG / 最大5MB</p>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
