'use client';

import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import type { StudioFormValues } from '../studio-form.schema';

export function StudioFormNotes() {
  const form = useFormContext<StudioFormValues>();

  return (
    <FormField
      control={form.control}
      name="internalNotes"
      render={({ field }) => (
        <FormItem>
          <label className="mb-1 block text-sm font-medium">備考</label>
          <FormControl>
            <Textarea
              className="text-sm"
              rows={3}
              placeholder="管理用のメモを入力してください..."
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}
