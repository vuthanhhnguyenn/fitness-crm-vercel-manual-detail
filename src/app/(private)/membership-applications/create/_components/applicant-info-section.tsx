'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { type Control, useWatch } from 'react-hook-form';

import { calcAge, isBelowMinAge } from '@/utils/age.util';
import { toSelectItems } from '@/utils/app.util';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle } from 'lucide-react';

import { ImageUpload } from '@/components/common/image-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

import { BRAND_MIN_AGE } from '../../_constants/constants';
import type { DirectEnrollmentFormValues } from '../_schemas/enrollment-form.schema';

interface ApplicantInfoSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly onUploadingChange?: (uploading: boolean) => void;
  readonly isPrefilled: boolean;
}

const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'no_answer', label: '回答しない' },
];

export function ApplicantInfoSection({
  control,
  onUploadingChange,
  isPrefilled,
}: ApplicantInfoSectionProps) {
  const brand = useWatch({ control, name: 'contract.brand_id' });
  const birthDate = useWatch({ control, name: 'applicant.birth_date' });

  const age = birthDate ? calcAge(birthDate) : null;
  const minAge = brand ? BRAND_MIN_AGE[brand] : null;
  const belowMin = age !== null && brand ? isBelowMinAge(age, brand) : false;
  const isMinor = age !== null && !belowMin && age < 18;

  return (
    <Card>
      <CardHeader>
        <CardTitle>申請者情報</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isPrefilled && (
          <Alert className="border-info/50 bg-info/15 py-2">
            <CheckCircle className="text-info size-4" />
            <AlertDescription className="text-info text-xs">
              見学・体験の登録情報から氏名等をプリセットしました。内容をご確認ください。
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="applicant.family_name"
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
            name="applicant.given_name"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="applicant.family_name_kana"
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
            name="applicant.given_name_kana"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="applicant.birth_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  生年月日<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
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
                  items={toSelectItems(GENDER_OPTIONS)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
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
        </div>

        {age !== null && minAge !== null && (
          <div className="flex flex-col gap-3">
            {belowMin && (
              <Alert className="border-destructive/50 bg-destructive/15 py-2">
                <AlertTriangle className="text-destructive size-4" />
                <AlertDescription className="text-destructive text-xs">
                  年齢条件不適合: {age}歳。{brand}は{minAge}
                  歳以上が入会可能です。申請を受け付けられません。
                </AlertDescription>
              </Alert>
            )}
            {!belowMin && isMinor && (
              <>
                <Alert className="border-warning/50 bg-warning/15 py-2">
                  <AlertTriangle className="text-warning size-4" />
                  <AlertDescription className="text-warning text-xs">
                    未成年（{age}歳）— 保護者同意の確認が必要です。
                  </AlertDescription>
                </Alert>
                <FormField
                  control={control}
                  name="consent.parental_consent"
                  render={({ field }) => (
                    <FormItem>
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(!!v)}
                          className="mt-0.5"
                        />
                        <span className="leading-snug">
                          申込者が保護者の同意を得た上で申し込む旨を確認しました
                          <span className="text-destructive ml-0.5">*</span>
                        </span>
                      </label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {!belowMin && !isMinor && (
              <Alert className="border-success/50 bg-success/15 py-2">
                <CheckCircle className="text-success size-4" />
                <AlertDescription className="text-success text-xs">
                  年齢条件: 成人（{age}歳 / {brand}: {minAge}歳以上）
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        {age !== null && !brand && (
          <p className="text-muted-foreground text-xs">ブランドを選択すると年齢条件を判定します</p>
        )}

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

        <FormField
          control={control}
          name="applicant.face_photo_id"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                顔写真<span className="text-destructive ml-0.5">*</span>
              </FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || null}
                  onChange={(url) => field.onChange(url ?? '')}
                  onUploadingChange={onUploadingChange}
                  hint="BL照合精度向上・入退館顔認証に使用されます"
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
