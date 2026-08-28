'use client';

import type { RefObject } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';

import { cn } from '@/lib/utils';

import {
  EXERCISE_HAND_USAGE_LABELS,
  EXERCISE_HAND_USAGE_OPTIONS,
  EXERCISE_LEVEL_OPTIONS,
  findExerciseOptionLabel,
} from '../_constants/constants';
import type { ExerciseMasterOption } from '../_hooks/use-exercise-master-options';
import type { ExerciseFormInput, ExerciseFormValues } from '../_schemas/exercise-form.schema';

type ExerciseFormBasicTabProps = {
  categoryOptions: ExerciseMasterOption[];
  imageInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onHandleImageFiles: (files: File[]) => Promise<void>;
  onToolChange: (value: string | null) => void;
  primaryMuscleOptions: ExerciseMasterOption[];
  toolOptions: ExerciseMasterOption[];
  typeOptions: ExerciseMasterOption[];
};

export function ExerciseFormBasicTab({
  categoryOptions,
  imageInputRef,
  isUploading,
  onHandleImageFiles,
  onToolChange,
  primaryMuscleOptions,
  toolOptions,
  typeOptions,
}: Readonly<ExerciseFormBasicTabProps>) {
  const form = useFormContext<ExerciseFormInput>();
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: 'images',
  });
  const generatedEnglishName = useWatch({ control: form.control, name: 'nameEn' });
  const images = useWatch({ control: form.control, name: 'images', defaultValue: [] });
  const publishStatus = useWatch({ control: form.control, name: 'publishStatus' });
  const primaryMuscleId = useWatch({ control: form.control, name: 'primaryMuscleId' });
  const secondaryMuscleIds =
    useWatch({
      control: form.control,
      name: 'secondaryMuscleIds',
      defaultValue: [],
    }) ?? [];
  const selectedSecondaryMuscleLabels = secondaryMuscleIds
    .map((id) => findExerciseOptionLabel(primaryMuscleOptions, id))
    .filter((label): label is string => Boolean(label));
  const canUploadMoreImages = fields.length < 5;
  const imageDropzoneDisabled = !canUploadMoreImages || isUploading;

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="exerciseCode"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>エクササイズコード</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value} disabled className="h-8" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nameJa"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    エクササイズ名（日本語）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="エクササイズ名を入力" className="h-8" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2 md:col-span-2">
              <FormLabel>エクササイズ名（英語）</FormLabel>
              <div className="bg-muted/30 rounded-md border px-3 py-2">
                <p className="text-muted-foreground text-xs">
                  {generatedEnglishName?.trim()
                    ? generatedEnglishName
                    : '英語名（未入力時は自動翻訳）'}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    カテゴリ<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? findExerciseOptionLabel(categoryOptions, field.value)
                            : '選択してください'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
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
              name="primaryMuscleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    主働筋<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (!value) return;
                      const currentSecondary = form.getValues('secondaryMuscleIds') ?? [];
                      if (currentSecondary.includes(value)) {
                        form.setValue(
                          'secondaryMuscleIds',
                          currentSecondary.filter((id) => id !== value),
                          { shouldDirty: true },
                        );
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? findExerciseOptionLabel(primaryMuscleOptions, field.value)
                            : '選択してください'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {primaryMuscleOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
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
              name="secondaryMuscleIds"
              render={() => (
                <FormItem className="md:col-span-2">
                  <FormLabel>協働筋（任意）</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {primaryMuscleOptions
                      .filter((muscle) => muscle.id !== primaryMuscleId)
                      .map((muscle) => {
                        const selected = secondaryMuscleIds.includes(muscle.id);
                        return (
                          <Badge
                            key={muscle.id}
                            variant={selected ? 'default' : 'outline'}
                            className="cursor-pointer text-xs font-normal select-none"
                            onClick={() => {
                              const current = form.getValues('secondaryMuscleIds') ?? [];
                              form.setValue(
                                'secondaryMuscleIds',
                                selected
                                  ? current.filter((item) => item !== muscle.id)
                                  : [...current, muscle.id],
                                { shouldDirty: true },
                              );
                            }}
                          >
                            {muscle.label}
                          </Badge>
                        );
                      })}
                  </div>
                  {selectedSecondaryMuscleLabels.length > 0 ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      選択中: {selectedSecondaryMuscleLabels.join('、')}
                    </p>
                  ) : null}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    器具種別<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={onToolChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? findExerciseOptionLabel(toolOptions, field.value)
                            : '選択してください'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {toolOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
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
              name="exerciseTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    エクササイズタイプ<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? findExerciseOptionLabel(typeOptions, field.value)
                            : '選択してください'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
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
              name="handUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    両手使用区分<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? EXERCISE_HAND_USAGE_LABELS[field.value]
                            : '選択してください'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXERCISE_HAND_USAGE_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {EXERCISE_HAND_USAGE_LABELS[item.value]}
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
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    レベル<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? (EXERCISE_LEVEL_OPTIONS.find((item) => item.value === field.value)
                                ?.label ?? '選択してください')
                            : '選択してください'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXERCISE_LEVEL_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
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
              name="restSeconds"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>休憩時間（秒）</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value == null ? '' : String(field.value)}
                      placeholder="90"
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === '' ? undefined : Number(event.target.value),
                        )
                      }
                      className="h-8 w-28"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">動画URL</CardTitle>
          <p className="text-muted-foreground text-xs">
            YouTube等の動画URLを入力してください。会員アプリから参照できます。
          </p>
        </CardHeader>
        <CardContent className="px-6">
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>動画URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-8"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">サムネイル画像</CardTitle>
              <p className="text-muted-foreground text-sm">最大5枚まで登録できます。</p>
            </div>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {fields.length}/5
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={async (event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) {
                await onHandleImageFiles(files);
              }
              event.target.value = '';
            }}
          />
          <div
            role="button"
            tabIndex={imageDropzoneDisabled ? -1 : 0}
            className={cn(
              'border-border bg-background/50 flex min-h-40 items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors',
              imageDropzoneDisabled
                ? 'pointer-events-none cursor-not-allowed opacity-60'
                : 'hover:border-primary/50 hover:bg-muted/30 cursor-pointer',
            )}
            onClick={() => {
              if (!imageDropzoneDisabled) imageInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (imageDropzoneDisabled) return;
              if (event.key === 'Enter' || event.key === ' ') {
                imageInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              if (!imageDropzoneDisabled) event.preventDefault();
            }}
            onDrop={async (event) => {
              event.preventDefault();
              if (imageDropzoneDisabled) return;
              const files = Array.from(event.dataTransfer.files ?? []);
              if (files.length > 0) {
                await onHandleImageFiles(files);
              }
            }}
          >
            {isUploading ? (
              <div className="text-muted-foreground flex flex-col items-center gap-3">
                <Loader2 className="size-10 animate-spin" />
                <span className="text-sm">アップロード中...</span>
              </div>
            ) : fields.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <ImagePlus className="text-foreground/70 size-12" />
                <span className="text-base font-medium">クリックまたはドラッグでアップロード</span>
                <span className="text-sm">JPG・PNG / 最大5MB</span>
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <ImagePlus className="text-foreground/70 size-10" />
                <span className="text-sm font-medium">
                  さらに画像を追加
                  {!canUploadMoreImages ? '（上限に達しています）' : ''}
                </span>
                <span className="text-xs">クリックまたはドラッグで追加できます</span>
              </div>
            )}
          </div>
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-center text-xs">画像が未設定です</p>
          ) : null}
          {fields.map((field, index) => {
            const image = images[index];
            const imageUrl = image?.url;
            const isPrimary = image?.isPrimary ?? false;

            return (
              <div
                key={field.id}
                className="bg-background grid gap-3 rounded-xl border p-3 md:grid-cols-[160px_1fr_auto]"
              >
                <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`サムネイル ${index + 1}`}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center px-4 text-center text-xs">
                      画像URLを入力するとプレビューが表示されます
                    </div>
                  )}
                  {isPrimary ? (
                    <Badge className="absolute top-2 left-2 text-[10px]">メイン</Badge>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name={`images.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="https://..." className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={isPrimary}
                      onCheckedChange={(checked) => {
                        const current = form.getValues('images').map((image, imageIndex) => ({
                          ...image,
                          isPrimary: checked ? imageIndex === index : image.isPrimary,
                        }));
                        form.setValue('images', current as ExerciseFormValues['images'], {
                          shouldDirty: true,
                        });
                      }}
                    />
                    <span>メイン画像</span>
                  </label>
                </div>
                <div className="flex items-start justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">ステータス</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">エクササイズの公開/非公開</p>
              <p className="text-muted-foreground text-xs">
                公開にすると、モバイルアプリで会員にエクササイズが表示されます
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">非公開</span>
              <Switch
                checked={publishStatus === 'public'}
                onCheckedChange={(checked) =>
                  form.setValue('publishStatus', checked ? 'public' : 'private', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <span className="text-sm font-medium">公開</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
