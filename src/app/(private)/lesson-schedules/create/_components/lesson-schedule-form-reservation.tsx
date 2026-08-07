'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Info } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { BUFFER_DURATION_OPTIONS, MINIMUM_RECEPTION_OPTIONS } from '../_constants/constants';
import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';

export function LessonScheduleFormReservation() {
  const form = useFormContext<LessonScheduleFormValues>();
  const isPublished = useWatch({ control: form.control, name: 'is_published' });

  return (
    <Card>
      <CardContent className="px-6">
        <h2 className="mb-4 text-base font-bold">予約設定</h2>

        {!isPublished && (
          <div className="border-info/20 bg-info/15 mb-4 flex items-center gap-2 rounded-md border px-3 py-2">
            <Info className="text-info size-4 shrink-0" />
            <p className="text-info text-xs">
              この枠は非公開（モードB）です。会員アプリからの予約は受け付けません
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="mb-3 block text-sm font-medium">バッファ設定</Label>
            <div className="border-info/20 bg-info/15 mb-3 flex items-start gap-2 rounded-md border px-3 py-2">
              <Info className="text-info mt-0.5 size-4 shrink-0" />
              <p className="text-info text-xs">
                バッファ設定は指導者ごとに一意です。下記は指導者プロフィール（D-04）の現在値を表示しています。値を変更すると指導者プロフィールに反映されます。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground mb-1 block text-xs">最短受付期間</Label>
                <Select
                  defaultValue={MINIMUM_RECEPTION_OPTIONS[0].value}
                  items={MINIMUM_RECEPTION_OPTIONS}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINIMUM_RECEPTION_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground mb-1 block text-xs">前バッファ</Label>
                <Select
                  defaultValue={BUFFER_DURATION_OPTIONS[0].value}
                  items={BUFFER_DURATION_OPTIONS}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUFFER_DURATION_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground mb-1 block text-xs">後バッファ</Label>
                <Select
                  defaultValue={BUFFER_DURATION_OPTIONS[0].value}
                  items={BUFFER_DURATION_OPTIONS}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUFFER_DURATION_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
