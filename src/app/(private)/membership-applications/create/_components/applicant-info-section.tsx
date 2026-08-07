'use client';

import { type Control } from 'react-hook-form';

import { GENDER_LABELS } from '@/app/(private)/members/_constants/constants';
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

import { ImageUpload } from '../../../../../components/common/image-upload';
import type { DirectEnrollmentFormValues } from './enrollment-form';

interface ApplicantInfoSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly onUploadingChange?: (uploading: boolean) => void;
}

export function ApplicantInfoSection({ control, onUploadingChange }: ApplicantInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>申請者情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Row 1: last/first name kanji */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="applicant.last_name_kanji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  氏名（姓）<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="例: 山田" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="applicant.first_name_kanji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  氏名（名）<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="例: 太郎" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Row 2: last/first name kana */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="applicant.last_name_kana"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  フリガナ（姓）<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="例: ヤマダ" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="applicant.first_name_kana"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  フリガナ（名）<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="例: タロウ" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Row 3: dob + gender */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="applicant.date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  生年月日<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  {/* <Input {...field} type="date" /> */}
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    placeholder="日付を選択"
                    onDateChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="applicant.gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  性別<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  items={GENDER_LABELS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(GENDER_LABELS).map(([value, label]) => (
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
        </div>
        {/* Row 4: phone + email */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="applicant.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  電話番号<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="例: 090-1234-5678" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="applicant.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  メールアドレス<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="例: yamada@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Row 5: address */}
        <FormField
          control={control}
          name="applicant.address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>住所</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例: 東京都渋谷区神宮前1-1-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Row 6: face photo */}
        <FormField
          control={control}
          name="applicant.face_photo_url"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                顔写真<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value ?? null}
                  onChange={(url) => field.onChange(url ?? '')}
                  onUploadingChange={onUploadingChange}
                  hint="BL照合精度向上・B-01入退館顔認証に使用されます"
                  hasError={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
