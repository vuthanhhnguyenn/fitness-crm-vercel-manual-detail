'use client';

import { useFormContext } from 'react-hook-form';

import { PREFECTURES } from '@/constants/app.constants';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { STAFF_ROLE_LABELS, StaffRole } from '../../../_constants/constants';
import type { StaffEditFormValues } from '../_schemas/staff-edit-form.schema';

const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

export function PersonalInfoSection() {
  const form = useFormContext<StaffEditFormValues>();
  return (
    <Card>
      <CardHeader>
        <CardTitle>個人情報</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Row 1: 名前（姓） / 名前（名） — both required */}
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                名前（姓）<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                名前（名）<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 2: カタカナ（姓） / カタカナ（名） — optional */}
        <FormField
          control={form.control}
          name="last_name_kana"
          render={({ field }) => (
            <FormItem>
              <FormLabel>カタカナ（姓）</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="first_name_kana"
          render={({ field }) => (
            <FormItem>
              <FormLabel>カタカナ（名）</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 3: 性別 (Select) / 生年月日 (date) — both optional */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>性別</FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
                items={GENDER_OPTIONS}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDER_OPTIONS.map((item) => (
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
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>生年月日</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value ? new Date(field.value) : undefined}
                  placeholder="日付を選択"
                  onDateChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 4: ロール — left col only (half width) */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                ロール<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange} items={STAFF_ROLE_LABELS}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(STAFF_ROLE_LABELS)
                    .filter(([value]) => value !== StaffRole.SYSTEM)
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div />

        {/* Row 5: 携帯電話番号 — left col only (half width) */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>携帯電話番号</FormLabel>
              <FormControl>
                <Input placeholder="090-1234-5678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* empty right col */}
        <div />

        {/* Row 6: メールアドレス — left col only (half width), required */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                メールアドレス<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* empty right col */}
        <div />

        {/* Row 6: 郵便番号 / 都道府県 (Select) — both optional */}
        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>郵便番号</FormLabel>
              <FormControl>
                <Input placeholder="160-0022" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prefecture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>都道府県</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PREFECTURES.map((pref) => (
                    <SelectItem key={pref} value={pref}>
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 7: 市区町村 — full width */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>市区町村</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 9: 番地 — full width */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>番地</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row 10: 建物名 — full width */}
        <FormField
          control={form.control}
          name="building"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>建物名</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
