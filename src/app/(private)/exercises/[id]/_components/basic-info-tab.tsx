'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';

import { Dumbbell, ExternalLink } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmExercisesByIdResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { ExerciseImageGallery } from '../../_components/exercise-image-gallery';
import {
  EXERCISE_CATEGORY_BADGE_CLASSES,
  EXERCISE_HAND_USAGE_LABELS,
  EXERCISE_LEVEL_BADGE_CLASSES,
  EXERCISE_LEVEL_LABELS,
  EXERCISE_STATUS_BADGE_CLASSES,
  EXERCISE_STATUS_DOT_CLASSES,
  EXERCISE_STATUS_LABELS,
} from '../../_constants/constants';

type ExerciseDetail = NonNullable<GetCrmExercisesByIdResponse>['exercise'];

type BasicInfoTabProps = {
  exercise: ExerciseDetail;
  onOpenPublishStatusDialog: () => void;
};

function FieldBlock({
  label,
  value,
}: Readonly<{
  label: string;
  value: ReactNode;
}>) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function BasicInfoTab({ exercise, onOpenPublishStatusDialog }: Readonly<BasicInfoTabProps>) {
  const isPrivate = exercise.publishStatus === 'private';

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-4">
          <div className="space-y-4">
            <FieldBlock label="エクササイズ名（英語）" value={exercise.nameEn || '未設定'} />
            <FieldBlock
              label="説明文"
              value={<p className="leading-relaxed">{exercise.overviewJa || '未設定'}</p>}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <FieldBlock
                label="カテゴリ"
                value={
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', EXERCISE_CATEGORY_BADGE_CLASSES)}
                  >
                    {exercise.categoryName}
                  </Badge>
                }
              />
              <FieldBlock
                label="協働筋"
                value={
                  exercise.secondaryMuscleNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {exercise.secondaryMuscleNames.map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-[10px]">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    '未設定'
                  )
                }
              />
              <FieldBlock label="エクササイズタイプ" value={exercise.exerciseTypeName} />
              <FieldBlock
                label="レベル"
                value={
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', EXERCISE_LEVEL_BADGE_CLASSES[exercise.level])}
                  >
                    {EXERCISE_LEVEL_LABELS[exercise.level]}
                  </Badge>
                }
              />
              <FieldBlock
                label="ステータス"
                value={
                  <Badge
                    variant="outline"
                    className={cn(
                      'gap-1 text-[10px]',
                      EXERCISE_STATUS_BADGE_CLASSES[exercise.publishStatus],
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        EXERCISE_STATUS_DOT_CLASSES[exercise.publishStatus],
                      )}
                    />
                    {EXERCISE_STATUS_LABELS[exercise.publishStatus]}
                  </Badge>
                }
              />
            </div>

            <div className="space-y-4">
              <FieldBlock label="主働筋" value={exercise.primaryMuscleName} />
              <FieldBlock label="器具種別" value={exercise.toolName} />
              <FieldBlock
                label="両手使用区分"
                value={EXERCISE_HAND_USAGE_LABELS[exercise.handUsage]}
              />
              <FieldBlock label="休憩時間" value={`${exercise.restSeconds}秒`} />
              <FieldBlock
                label="最終更新日"
                value={new Date(exercise.updatedAt).toLocaleString('ja-JP')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full space-y-4 lg:sticky lg:top-0 lg:w-[40%]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">ステータス</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <div
              className={cn(
                'flex size-24 items-center justify-center rounded-full',
                isPrivate ? 'bg-muted/40' : 'bg-success/15',
              )}
            >
              <Dumbbell
                className={cn('size-10', isPrivate ? 'text-muted-foreground' : 'text-success')}
              />
            </div>
            <Badge
              variant="outline"
              className={cn('gap-1 text-xs', EXERCISE_STATUS_BADGE_CLASSES[exercise.publishStatus])}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  EXERCISE_STATUS_DOT_CLASSES[exercise.publishStatus],
                )}
              />
              {EXERCISE_STATUS_LABELS[exercise.publishStatus]}
            </Badge>
            <p className="text-muted-foreground text-xs">
              最終更新: {new Date(exercise.updatedAt).toLocaleDateString('ja-JP')}
            </p>
            <div className="w-full border-t pt-3">
              <RoleGatedButton
                requiredPermission={Permission.ExercisesPublish}
                fullWidth
                variant="outline"
                className="h-10 w-full justify-center"
                onClick={onOpenPublishStatusDialog}
              >
                {exercise.publishStatus === 'private' ? '公開する' : '非公開にする'}
              </RoleGatedButton>
            </div>
          </CardContent>
        </Card>

        <ExerciseImageGallery images={exercise.images} exerciseName={exercise.nameJa} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">動画URL</CardTitle>
          </CardHeader>
          <CardContent>
            {exercise.videoUrl ? (
              <Link
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
              >
                <ExternalLink className="size-4" />
                {exercise.videoUrl}
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">未設定</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">紐づけ機材</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {exercise.linkedEquipment.length > 0 ? (
              exercise.linkedEquipment.map((item) => (
                <div key={item.id} className="rounded-md border px-3 py-2 text-sm">
                  {item.label}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">未設定</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
