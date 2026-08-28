'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { type Control } from 'react-hook-form';

import { useAuthUser } from '@/contexts/auth-user.context';
import { format } from 'date-fns';

import { DateTimePicker } from '@/components/common/date-time-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { DirectEnrollmentFormValues } from '../_schemas/enrollment-form.schema';

interface ProxyRecordSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
}

export function ProxyRecordSection({ control }: ProxyRecordSectionProps) {
  const { user } = useAuthUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>代理申請記録</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 items-start gap-4">
          <FormField
            control={control}
            name="consent.agreement_datetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  合意日時<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date ? format(date, "yyyy-MM-dd'T'HH:mm") : '')
                    }
                    placeholder="日時を選択"
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  申請者が申込内容に同意した日時を入力してください。未入力の場合は入会登録（承認）に進めません
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel className="text-muted-foreground">代理申請者</FormLabel>
            <FormControl>
              <Input readOnly value={user?.name ?? '—'} />
            </FormControl>
          </FormItem>
        </div>
        <p className="text-muted-foreground text-xs">代理申請者は操作ログから自動記録されます。</p>
      </CardContent>
    </Card>
  );
}
