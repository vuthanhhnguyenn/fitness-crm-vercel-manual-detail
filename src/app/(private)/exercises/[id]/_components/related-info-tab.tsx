'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmExercisesByIdResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { EXERCISE_LEVEL_BADGE_CLASSES, EXERCISE_LEVEL_LABELS } from '../../_constants/constants';

type ExerciseDetail = NonNullable<GetCrmExercisesByIdResponse>['exercise'];

type RelatedInfoTabProps = {
  tags: ExerciseDetail['tags'];
  relatedExercises: ExerciseDetail['relatedExercises'];
};

export function RelatedInfoTab({ tags, relatedExercises }: Readonly<RelatedInfoTabProps>) {
  const enabledTags = tags.filter((tag) => tag.enabled);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">タグ設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enabledTags.length > 0 ? (
            enabledTags.map((tag) => (
              <div key={tag.id} className="space-y-2">
                <p className="text-muted-foreground text-xs">{tag.category}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    {tag.label}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">未設定</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">関連エクササイズ（最大3件）</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedExercises.length > 0 ? (
            <div className="space-y-3">
              {relatedExercises.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.nameJa}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.exerciseCode} / {item.categoryName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-[10px]', EXERCISE_LEVEL_BADGE_CLASSES[item.level])}
                  >
                    {EXERCISE_LEVEL_LABELS[item.level]}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">未設定</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
