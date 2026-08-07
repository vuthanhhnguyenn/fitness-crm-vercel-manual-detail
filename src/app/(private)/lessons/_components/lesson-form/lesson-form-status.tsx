'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import type { LessonFormValues } from '../../_schemas/lesson-form.schema';

export function LessonFormStatus() {
  const form = useFormContext<LessonFormValues>();
  const status = useWatch({ control: form.control, name: 'status' });

  const isActive = status === 'active';

  const toggleStatus = (checked: boolean) => {
    form.setValue('status', checked ? 'active' : 'inactive', { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">ステータス</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">現在のステータス</p>
            {isActive ? (
              <Badge
                variant="outline"
                className="bg-success/15 text-success border-success/20 w-fit gap-1 text-xs font-medium"
              >
                <span className="bg-success size-1.5 rounded-full" />
                有効
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-muted-foreground/20 w-fit gap-1 text-xs font-medium"
              >
                <span className="bg-muted-foreground size-1.5 rounded-full" />
                無効
              </Badge>
            )}
            <p className="text-muted-foreground text-xs">
              無効にすると、新規スケジュール登録時の選択肢に表示されません。既存のスケジュールは引き続き有効です。
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={toggleStatus} />
        </div>
      </CardContent>
    </Card>
  );
}
