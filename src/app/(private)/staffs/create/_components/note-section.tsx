'use client';

import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/common/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

import type { StaffCreateFormValues } from '../_schemas/staff-create.schema';

export function NoteSection() {
  const form = useFormContext<StaffCreateFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">備考</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField label="備考" optional error={form.formState.errors.note?.message}>
          <Textarea
            placeholder="備考を入力してください（任意）"
            className="min-h-[100px] text-sm leading-relaxed"
            maxLength={1000}
            {...form.register('note')}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
