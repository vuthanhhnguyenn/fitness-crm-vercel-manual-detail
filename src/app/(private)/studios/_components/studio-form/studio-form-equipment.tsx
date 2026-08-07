'use client';

import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import type { StudioFormValues } from '../studio-form.schema';

export function StudioFormEquipment() {
  const form = useFormContext<StudioFormValues>();

  return (
    <FormField
      control={form.control}
      name="equipmentNotes"
      render={({ field }) => (
        <FormItem>
          <label className="mb-1 block text-sm font-medium">設備・備品</label>
          <FormControl>
            <Textarea
              className="text-sm"
              rows={3}
              placeholder="例: ヨガマット20枚、ミラー壁面、音響設備..."
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}
