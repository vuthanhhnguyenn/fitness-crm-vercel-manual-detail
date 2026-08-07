'use client';

import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';

import { useImageUpload } from '@/hooks/use-image-upload.hook';

import { Button } from '@/components/ui/button';

import type { StudioFormValues, StudioImageItem } from '../studio-form.schema';

export function StudioFormImages() {
  const form = useFormContext<StudioFormValues>();
  const images = useWatch({ control: form.control, name: 'images' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFiles, isUploading } = useImageUpload({ category: 'studio' });

  const appendImages = async (files: File[]) => {
    if (files.length === 0) return;
    const urls = await uploadFiles(files);
    if (urls.length === 0) return;
    const current = form.getValues('images');
    const newItems: StudioImageItem[] = urls.map((url) => ({
      id: crypto.randomUUID(),
      url,
    }));
    form.setValue('images', [...current, ...newItems], {
      shouldDirty: true,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    appendImages(files);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    const current = form.getValues('images');
    form.setValue(
      'images',
      current.filter((img) => img.id !== id),
      { shouldDirty: true },
    );
  };

  return (
    <>
      <h2 className="mb-4 text-base font-bold">スタジオ画像</h2>
      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-transparent"
            >
              <div className="relative aspect-3/2">
                <Image src={img.url} alt="スタジオ画像" fill unoptimized className="object-cover" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-destructive absolute top-1 right-1 size-6 rounded bg-black/50 p-0 text-white opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeImage(img.id)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          appendImages(Array.from(e.dataTransfer.files ?? []));
        }}
        className="border-muted-foreground/20 hover:border-primary/40 w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? (
          <Loader2 className="text-muted-foreground/40 mx-auto mb-2 size-8 animate-spin" />
        ) : (
          <ImageIcon className="text-muted-foreground/40 mx-auto mb-2 size-8" />
        )}
        <p className="text-muted-foreground text-sm font-medium">
          {isUploading ? 'アップロード中...' : '画像をドラッグ&ドロップで追加'}
        </p>
        <p className="text-muted-foreground mt-1 text-[10px]">
          推奨: 1200 x 800px (3:2) | JPG, PNG, WebP | 最大5MB | 複数枚対応
        </p>
        <span className="bg-background hover:bg-accent mt-3 inline-flex h-8 items-center justify-center gap-1 rounded-md border px-3 text-xs">
          <Upload className="size-3" />
          画像を追加
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
}
