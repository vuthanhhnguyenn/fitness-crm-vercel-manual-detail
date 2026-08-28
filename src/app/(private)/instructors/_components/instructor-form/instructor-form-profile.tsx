'use client';

import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import type { InstructorFormValues } from '../instructor-form.schema';

export function InstructorFormProfile() {
  const form = useFormContext<InstructorFormValues>();

  return (
    <>
      <h2 className="mb-4 text-base font-bold">プロフィール</h2>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="profileText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">プロフィール文</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="指導者のプロフィールを入力してください..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instructingHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">指導歴</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="経験年数・取得資格・専門分野等を入力してください..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
