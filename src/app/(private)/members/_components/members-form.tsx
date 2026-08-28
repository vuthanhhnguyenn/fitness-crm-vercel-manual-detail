'use client';

// 'use client': react-hook-form context + Radix Select require browser events.
import { useFormContext } from 'react-hook-form';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { toSelectItems } from '@/utils/app.util';
import { formatISODateLocal, parseDate } from '@/utils/date.util';

import { RequiredMark } from '@/components/common/field-marker';
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

import {
  GENDER_OPTIONS,
  type MemberFormValues,
  NAME_MAX_LENGTH,
} from '../_schemas/member-form.schema';

const genderSelectItems = toSelectItems([...GENDER_OPTIONS]);

export function MembersForm() {
  const form = useFormContext<MemberFormValues>();

  return (
    <Card>
      <CardHeader className="px-4">
        <CardTitle className="text-base font-semibold">個人情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    氏名（姓）
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 山田" maxLength={NAME_MAX_LENGTH} {...field} />
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
                    氏名（名）
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 太郎" maxLength={NAME_MAX_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name="last_name_kana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    フリガナ（姓）
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: ヤマダ" maxLength={NAME_MAX_LENGTH} {...field} />
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
                  <FormLabel>
                    フリガナ（名）
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: タロウ" maxLength={NAME_MAX_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    生年月日
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={parseDate(field.value) ?? undefined}
                      placeholder="日付を選択"
                      hasError={Boolean(form.formState.errors.birthday)}
                      onDateChange={(date) => field.onChange(date ? formatISODateLocal(date) : '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    性別
                    <RequiredMark />
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    key={`gender-${field.value || 'empty'}`}
                    items={genderSelectItems}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>郵便番号</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 150-0001"
                    className="w-50"
                    maxLength={TEXT_MAX_LENGTH}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>住所</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 東京都渋谷区神宮前1-1-1"
                    maxLength={TEXT_MAX_LENGTH}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 items-start gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    電話番号
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 090-1234-5678" maxLength={TEXT_MAX_LENGTH} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    メールアドレス
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="例: yamada@example.com"
                      maxLength={TEXT_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
