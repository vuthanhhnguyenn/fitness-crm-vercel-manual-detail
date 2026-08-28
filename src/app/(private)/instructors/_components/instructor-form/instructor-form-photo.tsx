'use client';

import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';

import { useImageUpload } from '@/hooks/use-image-upload.hook';

import { Button } from '@/components/ui/button';

import type { InstructorFormValues } from '../instructor-form.schema';

export function InstructorFormPhoto() {
  const form = useFormContext<InstructorFormValues>();
  const photoUrl = useWatch({ control: form.control, name: 'photoUrl' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useImageUpload({
    category: 'avatar',
    maxSizeMB: 2,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await uploadFile(file);
    if (url) form.setValue('photoUrl', url, { shouldDirty: true });
  };

  return (
    <>
      <h2 className="mb-4 text-base font-bold">画像</h2>
      <div className="flex items-start gap-6">
        {photoUrl ? (
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full border">
            <Image
              src={photoUrl}
              alt="プロフィール画像"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="border-border text-muted-foreground flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed">
            <ImageIcon className="size-6" />
            <span className="text-[10px]">画像を追加</span>
          </div>
        )}
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              画像をアップロード
            </Button>
            {photoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1 text-xs"
                onClick={() => form.setValue('photoUrl', null, { shouldDirty: true })}
              >
                <Trash2 className="size-3.5" />
                削除
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-[10px]">
            推奨サイズ: 400×400px / JPG, PNG / 最大2MB
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
}
