'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import type { GetCrmExercisesResponse } from '@/lib/api/types.gen';

import { EXERCISE_TAGS, groupExerciseTags } from '../_constants/constants';
import type { ExerciseFormInput } from '../_schemas/exercise-form.schema';

type EquipmentOption = {
  id: string;
  label: string;
};

function EquipmentChecklistSection({
  disabled,
  equipment,
  onSearchTextChange,
  onToggle,
  searchText,
  selectedIds,
}: {
  disabled?: boolean;
  equipment: readonly EquipmentOption[];
  onSearchTextChange: (value: string) => void;
  onToggle: (id: string, checked: boolean) => void;
  searchText: string;
  selectedIds: string[];
}) {
  const selectedItems = equipment.filter((item) => selectedIds.includes(item.id));
  const availableItems = equipment.filter(
    (item) =>
      !selectedIds.includes(item.id) && item.label.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {selectedItems.length > 0 ? (
        <div className="bg-muted/40 rounded-md border p-2">
          <p className="text-muted-foreground px-2 py-1 text-xs">
            選択中（{selectedItems.length}件）
          </p>
          <div className="space-y-1">
            {selectedItems.map((item) => (
              <label
                key={item.id}
                className="hover:bg-background flex items-center gap-2 rounded-md px-2 py-2 text-sm"
              >
                <Checkbox
                  checked
                  onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
                />
                <span>{item.label}</span>
                <span className="text-muted-foreground ml-auto text-xs">{item.id}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <Input
        value={searchText}
        onChange={(event) => onSearchTextChange(event.target.value)}
        placeholder="機材名で検索"
        className="h-8"
        disabled={disabled}
      />

      <div className="space-y-1 rounded-md border p-3">
        {!disabled
          ? availableItems.map((item) => (
              <label
                key={item.id}
                className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-2 text-sm"
              >
                <Checkbox
                  checked={false}
                  disabled={disabled}
                  onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
                />
                <span>{item.label}</span>
                <span className="text-muted-foreground ml-auto text-xs">{item.id}</span>
              </label>
            ))
          : null}
        {!disabled && availableItems.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-xs">該当する機材がありません</p>
        ) : null}
      </div>
    </div>
  );
}

function RelatedExerciseSelectorSection({
  currentExerciseId,
  onSearchTextChange,
  onToggle,
  options,
  searchText,
  selectedIds,
}: {
  currentExerciseId?: string;
  onSearchTextChange: (value: string) => void;
  onToggle: (id: string, checked: boolean) => void;
  options: GetCrmExercisesResponse['items'];
  searchText: string;
  selectedIds: string[];
}) {
  const availableOptions = options.filter(
    (item) =>
      item.id !== currentExerciseId &&
      !selectedIds.includes(item.id) &&
      item.nameJa.toLowerCase().includes(searchText.toLowerCase()),
  );
  const selectedOptions = selectedIds
    .map((id) => options.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        最大3件まで設定できます。同一エクササイズは選択できません。
      </p>

      {selectedOptions.length > 0 ? (
        <div className="bg-muted/40 rounded-md border p-2">
          <p className="text-muted-foreground px-2 py-1 text-xs">
            選択中（{selectedOptions.length}件）
          </p>
          <div className="space-y-1">
            {selectedOptions.map((item) => (
              <label
                key={item.id}
                className="hover:bg-background flex items-center gap-2 rounded-md px-2 py-2 text-sm"
              >
                <Checkbox
                  checked
                  onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
                />
                <div className="min-w-0">
                  <p className="truncate">{item.nameJa}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.exerciseCode} / {item.categoryName} /{' '}
                    {item.level === 'expert' ? 'エキスパート' : 'ビギナー'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <Input
        value={searchText}
        onChange={(event) => onSearchTextChange(event.target.value)}
        placeholder="エクササイズ名で検索"
        className="h-8"
      />

      <div className="space-y-1 rounded-md border p-3">
        {availableOptions.map((item) => (
          <label
            key={item.id}
            className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-2 text-sm"
          >
            <Checkbox
              checked={false}
              disabled={selectedIds.length >= 3}
              onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
            />
            <div className="min-w-0">
              <p className="truncate">{item.nameJa}</p>
              <p className="text-muted-foreground text-xs">
                {item.exerciseCode} / {item.categoryName} /{' '}
                {item.level === 'expert' ? 'エキスパート' : 'ビギナー'}
              </p>
            </div>
          </label>
        ))}
        {availableOptions.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-xs">
            {selectedIds.length >= 3
              ? '関連エクササイズは3件まで選択済みです'
              : '該当するエクササイズがありません'}
          </p>
        ) : null}
      </div>
    </div>
  );
}

type ExerciseFormRelatedTabProps = {
  currentExerciseId?: string;
  equipmentOptions: EquipmentOption[];
  equipmentSearch: string;
  isBodyweightToolSelected: boolean;
  isEquipmentError: boolean;
  isEquipmentLoading: boolean;
  onEquipmentSearchChange: (value: string) => void;
  onRelatedExerciseSearchChange: (value: string) => void;
  relatedExerciseOptions: GetCrmExercisesResponse['items'];
  relatedExerciseSearch: string;
};

export function ExerciseFormRelatedTab({
  currentExerciseId,
  equipmentOptions,
  equipmentSearch,
  isBodyweightToolSelected,
  isEquipmentError,
  isEquipmentLoading,
  onEquipmentSearchChange,
  onRelatedExerciseSearchChange,
  relatedExerciseOptions,
  relatedExerciseSearch,
}: Readonly<ExerciseFormRelatedTabProps>) {
  const form = useFormContext<ExerciseFormInput>();
  const enabledTagIds =
    useWatch({
      control: form.control,
      name: 'enabledTagIds',
      defaultValue: [],
    }) ?? [];
  const linkedEquipmentIds =
    useWatch({
      control: form.control,
      name: 'linkedEquipmentIds',
      defaultValue: [],
    }) ?? [];
  const relatedExerciseIds =
    useWatch({
      control: form.control,
      name: 'relatedExerciseIds',
      defaultValue: [],
    }) ?? [];
  const groupedTags = groupExerciseTags(EXERCISE_TAGS);

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">機材紐づけ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          {isEquipmentLoading ? (
            <p className="text-muted-foreground text-xs">機材一覧を読み込み中です...</p>
          ) : null}
          {isEquipmentError ? (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                機材一覧の取得に失敗しました。時間をおいて再度お試しください。
              </AlertDescription>
            </Alert>
          ) : null}
          <EquipmentChecklistSection
            disabled={isBodyweightToolSelected || isEquipmentLoading || isEquipmentError}
            equipment={isBodyweightToolSelected ? [] : equipmentOptions}
            onSearchTextChange={onEquipmentSearchChange}
            onToggle={(id, checked) => {
              const current = form.getValues('linkedEquipmentIds') ?? [];
              form.setValue(
                'linkedEquipmentIds',
                checked ? [...current, id] : current.filter((value) => value !== id),
                { shouldDirty: true, shouldValidate: true },
              );
            }}
            searchText={equipmentSearch}
            selectedIds={linkedEquipmentIds}
          />
          <FormField
            control={form.control}
            name="linkedEquipmentIds"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">関連エクササイズ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6">
          <RelatedExerciseSelectorSection
            currentExerciseId={currentExerciseId}
            onSearchTextChange={onRelatedExerciseSearchChange}
            onToggle={(id, checked) => {
              const current = form.getValues('relatedExerciseIds') ?? [];
              form.setValue(
                'relatedExerciseIds',
                checked ? [...current, id] : current.filter((value) => value !== id),
                { shouldDirty: true, shouldValidate: true },
              );
            }}
            options={relatedExerciseOptions}
            searchText={relatedExerciseSearch}
            selectedIds={relatedExerciseIds}
          />
          <FormField
            control={form.control}
            name="relatedExerciseIds"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">タグ設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6">
          <p className="text-muted-foreground text-xs">
            このエクササイズで有効化するタグを選択してください。ONにしたタグのみ、モバイルアプリで会員がエクササイズ記録時に選択できます。
          </p>
          {groupedTags.map(([category, items]) => (
            <div key={category} className="space-y-2">
              <p className="text-muted-foreground text-xs">{category}</p>
              <div className="flex flex-wrap gap-4">
                {items.map((tag) => {
                  const checked = enabledTagIds.includes(tag.id);
                  return (
                    <label key={tag.id} className="flex items-center gap-2">
                      <Switch
                        checked={checked}
                        onCheckedChange={(next) => {
                          const current = form.getValues('enabledTagIds') ?? [];
                          form.setValue(
                            'enabledTagIds',
                            next
                              ? [...current, tag.id]
                              : current.filter((value) => value !== tag.id),
                            { shouldDirty: true },
                          );
                        }}
                      />
                      <span className="text-sm">{tag.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
