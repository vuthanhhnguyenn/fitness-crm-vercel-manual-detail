'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { PREFECTURES } from '@/constants/app.constants';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

import { getCrmStaffsOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { StaffEditFormValues } from '../_schemas/staff-edit-form.schema';

const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

interface PersonalInfoSectionProps {
  staffId: string;
}

export function PersonalInfoSection({ staffId }: PersonalInfoSectionProps) {
  const form = useFormContext<StaffEditFormValues>();
  const [emailCheckStatus, setEmailCheckStatus] = useState<null | 'ok' | 'duplicate'>(null);

  // 重複確認 (PAR087/088) — checked against other accounts' emails, excluding this staff's own
  const { data: allStaffsRes } = useQuery(getCrmStaffsOptions({ query: { page: 1, limit: 500 } }));

  const handleEmailCheck = () => {
    const email = form.getValues('email').trim().toLowerCase();
    const isDuplicate = (allStaffsRes?.staffs ?? []).some(
      (s) => s.id !== staffId && s.email.toLowerCase() === email,
    );
    setEmailCheckStatus(isDuplicate ? 'duplicate' : 'ok');
  };

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
                <Input maxLength={255} {...field} />
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
                <Input maxLength={255} {...field} />
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

        {/* Row 6: メールアドレス（ログインID） — left col only (half width), required + 重複確認 */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                メールアドレス（ログインID）<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input
                    type="email"
                    className="flex-1"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setEmailCheckStatus(null);
                    }}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={handleEmailCheck}
                  disabled={!field.value}
                >
                  重複確認
                </Button>
              </div>
              {emailCheckStatus === 'ok' && (
                <p className="text-success flex items-center gap-1 text-xs">
                  <Check className="size-3" />
                  このメールアドレスは使用可能です
                </p>
              )}
              {emailCheckStatus === 'duplicate' && (
                <p className="text-destructive flex items-center gap-1 text-xs">
                  <AlertTriangle className="size-3" />
                  このメールアドレスはすでに登録されています
                </p>
              )}
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
