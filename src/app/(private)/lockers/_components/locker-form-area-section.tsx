'use client';

import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { ImageIcon, Loader2, Map, Trash2, Upload } from 'lucide-react';

import { useImageUpload } from '@/hooks/use-image-upload.hook';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';

import { LOCKER_AREA_OPTIONS } from '../_constants/locker-form.constants';
import { useLockerLocationDuplicate } from '../_hooks/use-locker-location-duplicate.hook';
import type { LockerFormValues } from '../_schemas/locker-form.schema';
import { LockerFormFloorMap } from './locker-form-floor-map';

type LockerFormAreaSectionProps = {
  excludeLockerId?: string;
};

export function LockerFormAreaSection({ excludeLockerId }: LockerFormAreaSectionProps) {
  const form = useFormContext<LockerFormValues>();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const storeId = useWatch({ control: form.control, name: 'store_id' });
  const locationSymbol = useWatch({ control: form.control, name: 'location_symbol' });
  const imageUrl = useWatch({ control: form.control, name: 'image_url' });

  /**
   * FR-012 異常系: format / size limits. `useImageUpload` rejects anything that is not
   * JPG・PNG・WebP or is over 5MB with a toast, so an invalid file never reaches the form.
   */
  const { uploadFile, isUploading } = useImageUpload({
    category: 'other',
    errorMessage: 'ロッカー写真のアップロードに失敗しました',
  });

  const isLocationDuplicate = useLockerLocationDuplicate({
    storeId,
    locationSymbol,
    excludeLockerId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">設置エリア・案内文・写真</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {storeId ? <LockerFormFloorMap storeId={storeId} /> : null}

        <FormField
          control={form.control}
          name="location_symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                設置エリア（ロケーション記号）<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <Select
                key={`location-symbol-${field.value ?? 'empty'}`}
                value={field.value ? field.value : undefined}
                onValueChange={(value) => {
                  if (!value) return;
                  const option = LOCKER_AREA_OPTIONS.find((item) => item.value === value);
                  field.onChange(value);
                  form.setValue('area_label', option?.label ?? value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <FormControl>
                  <SelectTrigger className={isLocationDuplicate ? 'border-destructive' : ''}>
                    <SelectValue placeholder="設置エリアを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LOCKER_AREA_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLocationDuplicate ? (
                <p className="text-destructive mt-1 text-xs">同一店舗内で既に使用されています</p>
              ) : null}
              <FormMessage />
              <div className="border-info/20 bg-info/5 mt-3 flex items-start gap-2 rounded-lg border px-3 py-2">
                <Map className="text-info mt-0.5 size-4 shrink-0" />
                <div className="text-foreground/80 text-xs leading-relaxed">
                  選択肢は{' '}
                  <strong className="text-foreground">
                    Y-02 店舗管理 → 店舗マップ設定（Y-02-05）
                  </strong>{' '}
                  で登録されたエリア記号と連動します。フロアマップ画像の管理・エリア追加は店舗マップ設定側で行ってください。
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guide_text"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>案内文</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[80px] text-sm leading-relaxed"
                  placeholder="更衣室入口から右手奥、女性専用エリアの隣"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <p className="text-muted-foreground mt-2 text-xs">
                会員向けスロット選択画面に表示される案内情報です
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>補足説明</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[80px] text-sm leading-relaxed"
                  placeholder="スタッフ向けの補足説明（例: 1F男性更衣室入口付近に設置）"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <p className="text-muted-foreground mt-2 text-xs">
                スタッフ向けの補足説明です（会員には表示されません）
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field, fieldState }) => (
            <FormItem className="mt-4">
              <FormLabel>
                ロッカー写真<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              {imageUrl ? (
                <div>
                  <div className="relative w-48 overflow-hidden rounded-lg border">
                    <Image
                      src={imageUrl}
                      alt="ロッカー写真"
                      width={192}
                      height={144}
                      unoptimized
                      className="h-36 w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 size-7"
                      onClick={() => field.onChange(null)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2 text-xs"
                    disabled={isUploading}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    写真を変更
                  </Button>
                </div>
              ) : (
                // `aria-invalid` on the wrapper lets the scroll-to-first-error helper reach this field
                <div aria-invalid={Boolean(fieldState.error)}>
                  <button
                    type="button"
                    disabled={isUploading}
                    className={cn(
                      'text-muted-foreground hover:border-primary/40 flex w-full cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                      fieldState.error && 'border-destructive',
                    )}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="mx-auto mb-2 size-6 animate-spin" />
                    ) : (
                      <ImageIcon className="mx-auto mb-2 size-6" />
                    )}
                    <span className="border-input bg-background hover:bg-accent inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium">
                      <Upload className="size-4" />
                      {isUploading ? 'アップロード中...' : '写真を追加'}
                    </span>
                    <p className="mt-2 text-xs">JPG/PNG、最大5MB、推奨サイズ 800x600px</p>
                  </button>
                </div>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  // Returns null (and toasts) when the file breaks the format / size limits.
                  const url = await uploadFile(file);
                  if (url) field.onChange(url);
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
