import type { ChangeEvent, RefObject } from 'react';
import type { FieldErrors } from 'react-hook-form';

import Image from 'next/image';

import type { BannerFormValues } from '@/app/(private)/banners/_schemas/banner-form.schema';
import { Upload } from 'lucide-react';

import { FormField } from '@/components/common/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface BannerImageSectionProps {
  formErrors: FieldErrors<BannerFormValues>;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
}

export function BannerImageSection({
  formErrors,
  isUploading,
  fileInputRef,
  handleFileSelect,
  previewUrl,
}: BannerImageSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">バナー画像</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField label="バナー画像" required error={formErrors.imageUrl?.message?.toString()}>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                {isUploading ? 'アップロード中...' : '画像をアップロード'}
              </Button>
              <p className="text-muted-foreground text-xs">
                PNG, JPG, WebP（推奨サイズ: 1200×400px、最大5MB）
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </FormField>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">プレビュー</Label>
            <div className="w-full max-w-150 overflow-hidden rounded-lg border">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="バナープレビュー"
                  width={600}
                  height={200}
                  unoptimized
                  className="w-full object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex h-50 items-center justify-center text-xs">
                  画像がアップロードされていません
                </div>
              )}
            </div>
            {!previewUrl && (
              <p className="text-muted-foreground text-xs">
                ※ アップロード後に実際の画像が表示されます
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
