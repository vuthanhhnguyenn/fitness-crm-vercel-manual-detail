'use client';

import { useFormContext } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import type { LessonFormValues } from '../../_schemas/lesson-form.schema';

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </div>
      <h3 className="text-sm font-bold">{title}</h3>
    </div>
  );
}

export function LessonFormNotes() {
  const form = useFormContext<LessonFormValues>();

  return (
    <Card>
      <CardContent className="px-6">
        <SectionHeader number={5} title="備考" />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  className="min-h-[80px] text-sm"
                  placeholder="内部メモ・備考を入力（会員には表示されません）"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
