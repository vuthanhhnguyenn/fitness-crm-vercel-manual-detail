'use client';

import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { StaffEditFormValues } from '../_schemas/staff-edit-form.schema';

export function LoginSettingsSection() {
  const form = useFormContext<StaffEditFormValues>();
  return (
    <Card>
      <CardHeader>
        <CardTitle>ログイン設定</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4">
        {/* ログイン元— left col, half width */}
        <FormField
          control={form.control}
          name="login_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ログイン元</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                items={[{ value: 'email', label: 'メール' }]}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="email">メール</SelectItem>
                  {/* <SelectItem value="social">ソーシャル</SelectItem> */}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ソーシャルID — right col, with description */}
        <FormField
          control={form.control}
          name="social_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ソーシャルID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              {/* <FormDescription>ログイン元がソーシャルの場合に入力</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
