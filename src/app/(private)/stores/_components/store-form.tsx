'use client';

import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { PREFECTURES } from '@/constants/app.constants';
import { Upload, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { StoreArea, StoreListBrand, StoreListStatus } from '@/lib/api/types.gen';

import {
  STORE_AREA_LABELS,
  STORE_BRAND_LABELS,
  STORE_STATUS_LABELS,
} from '../_constants/constants';
import type { StoreFormValues } from '../_schemas/store-form.schema';

const MAX_STORE_PHOTOS = 5;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });

const mapBase64ToPreviews = (images: string[] = [], label: 'photo' | 'floor-map' = 'photo') =>
  images.map((base64, index) => ({
    id: `stored-${index}`,
    name: label === 'photo' ? `店舗写真${index + 1}` : 'フロアマップ',
    previewUrl: base64,
  }));

function UploadTile({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:border-primary hover:text-primary flex size-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors"
    >
      <Upload className="size-5" />
      <span className="text-sm">{label}</span>
    </button>
  );
}

/** Form UI shared by 店舗新規 and 店舗編集 */
export function StoreForm() {
  const form = useFormContext<StoreFormValues>();
  const storePhotosInputRef = useRef<HTMLInputElement>(null);
  const floorMapInputRef = useRef<HTMLInputElement>(null);

  const formStorePhotos = useWatch({ control: form.control, name: 'store_photos' });
  const formFloorMap = useWatch({ control: form.control, name: 'floor_map_url' });
  const storePhotos = mapBase64ToPreviews(formStorePhotos ?? []);
  const floorMap = formFloorMap ? mapBase64ToPreviews([formFloorMap], 'floor-map')[0] : null;

  const canAddMoreStorePhotos = storePhotos.length < MAX_STORE_PHOTOS;

  const handleStorePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const slots = MAX_STORE_PHOTOS - storePhotos.length;
    const uploadTargets = files.slice(0, slots);
    const currentPhotos = form.getValues('store_photos') ?? [];
    const nextFiles = await Promise.all(uploadTargets.map(async (file) => fileToBase64(file)));

    form.setValue('store_photos', [...currentPhotos, ...nextFiles], { shouldDirty: true });
    event.target.value = '';
  };

  const handleFloorMapUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const base64 = await fileToBase64(file);
    form.setValue('floor_map_url', base64, { shouldDirty: true });
    event.target.value = '';
  };

  const handleRemoveStorePhoto = (index: number) => {
    const currentPhotos = form.getValues('store_photos') ?? [];
    const nextPhotos = currentPhotos.filter((_, i) => i !== index);
    form.setValue('store_photos', nextPhotos, { shouldDirty: true });
  };

  const handleRemoveFloorMap = () => {
    form.setValue('floor_map_url', '', { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  店舗名<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="例: JOYFIT24新宿店" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>
                  ブランド<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  key={`brand-${field.value ?? 'empty'}`}
                  value={field.value ? field.value : undefined}
                  onValueChange={field.onChange}
                  items={STORE_BRAND_LABELS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(StoreListBrand).map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {STORE_BRAND_LABELS[brand]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operating_company_name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>運営企業</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 株式会社ウェルネスフロンティア"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>エリア</FormLabel>
                <Select
                  key={`area-${field.value ?? 'empty'}`}
                  value={field.value ? field.value : undefined}
                  onValueChange={field.onChange}
                  items={STORE_AREA_LABELS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(StoreArea).map((area) => (
                      <SelectItem key={area} value={area}>
                        {STORE_AREA_LABELS[area]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div />

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>郵便番号</FormLabel>
                <FormControl>
                  <Input placeholder="例: 160-0022" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prefecture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>都道府県</FormLabel>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PREFECTURES.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>住所</FormLabel>
                <FormControl>
                  <Input placeholder="例: 新宿区新宿3-1-1" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>メールアドレス</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="例: shinjuku@joyfit.co.jp"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>電話番号</FormLabel>
                <FormControl>
                  <Input placeholder="例: 03-1234-5678" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="club_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>クラブコード</FormLabel>
                <FormControl>
                  <Input placeholder="例: JF24-SJK" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accounting_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>会計コード</FormLabel>
                <FormControl>
                  <Input placeholder="例: ACC-001" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_fc"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 md:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                </FormControl>
                <FormLabel>FCフラグ</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ステータス<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  key={`status-${field.value ?? 'empty'}`}
                  value={field.value}
                  onValueChange={field.onChange}
                  items={STORE_STATUS_LABELS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(StoreListStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {STORE_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>店舗画像</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <p className="font-medium">店舗写真</p>
              <p className="text-muted-foreground text-sm">
                店舗の外観や内観写真をアップロードしてください（最大{MAX_STORE_PHOTOS}枚）
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {storePhotos.map((photo, index) => (
                <div
                  key={`${photo.id}-${index}`}
                  className="bg-muted relative size-40 overflow-hidden rounded-lg border"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveStorePhoto(index)}
                    className="bg-background/90 text-foreground hover:bg-background absolute top-2 right-2 z-10 rounded-full border p-1 transition-colors"
                    aria-label="店舗写真を削除"
                  >
                    <X className="size-3.5" />
                  </button>
                  <Image
                    src={photo.previewUrl}
                    alt={photo.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ))}
              {canAddMoreStorePhotos && (
                <UploadTile onClick={() => storePhotosInputRef.current?.click()} label="追加" />
              )}
            </div>
            <input
              ref={storePhotosInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleStorePhotoUpload}
            />
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-medium">フロアマップ</p>
              <p className="text-muted-foreground text-sm">
                店舗内のフロアマップ画像をアップロードしてください
              </p>
            </div>
            <div className="flex gap-3">
              {floorMap ? (
                <div className="bg-muted relative size-40 overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={handleRemoveFloorMap}
                    className="bg-background/90 text-foreground hover:bg-background absolute top-2 right-2 z-10 rounded-full border p-1 transition-colors"
                    aria-label="フロアマップを削除"
                  >
                    <X className="size-3.5" />
                  </button>
                  <Image
                    src={floorMap.previewUrl}
                    alt={floorMap.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <UploadTile onClick={() => floorMapInputRef.current?.click()} label="追加" />
              )}
            </div>
            <input
              ref={floorMapInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFloorMapUpload}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ソーシャル</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="interview_url"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>インドアビュー</FormLabel>
                <FormControl>
                  <Input placeholder="URLを入力" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="google_map_url"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Google Map</FormLabel>
                <FormControl>
                  <Input placeholder="URLを入力" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="x_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>X(旧Twitter)</FormLabel>
                <FormControl>
                  <Input placeholder="@アカウント名" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instagram_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="@アカウント名" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="line_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LINE</FormLabel>
                <FormControl>
                  <Input placeholder="LINE IDを入力" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="facebook_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook</FormLabel>
                <FormControl>
                  <Input placeholder="URLを入力" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youtube_url"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>YouTube</FormLabel>
                <FormControl>
                  <Input placeholder="URLを入力" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
