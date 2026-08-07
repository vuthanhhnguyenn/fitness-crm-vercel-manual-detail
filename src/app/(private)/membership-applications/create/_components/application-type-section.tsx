'use client';

import { type Control } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { APPLICATION_TYPE_LABELS, type ApplicationType } from '../_schemas/enrollment-form.schema';
import type { DirectEnrollmentFormValues } from './enrollment-form';

interface ApplicationTypeSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
}

const APPLICATION_TYPE_OPTIONS = Object.entries(APPLICATION_TYPE_LABELS).map(([value, label]) => ({
  value: value as ApplicationType,
  label,
}));

export function ApplicationTypeSection({ control }: ApplicationTypeSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>申請種別</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="application_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  申請種別<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  items={APPLICATION_TYPE_OPTIONS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {APPLICATION_TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
