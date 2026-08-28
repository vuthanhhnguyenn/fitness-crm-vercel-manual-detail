'use client';

import { useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { InstructorFormValues } from '../instructor-form.schema';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

const ROLE_OPTIONS: Array<{
  value: 'trainer' | 'instructor' | 'body_care_therapist';
  label: string;
}> = [
  { value: 'trainer', label: 'トレーナー' },
  { value: 'instructor', label: 'インストラクター' },
  { value: 'body_care_therapist', label: 'ボディケアセラピスト' },
];

interface InstructorFormBasicInfoProps {
  nameLocked?: boolean;
  roleClassificationsLocked?: boolean;
}

export function InstructorFormBasicInfo({
  nameLocked = false,
  roleClassificationsLocked = false,
}: InstructorFormBasicInfoProps) {
  const form = useFormContext<InstructorFormValues>();

  return (
    <>
      <h2 className="mb-4 text-base font-bold">基本情報</h2>
      <div className="space-y-4">
        <FormItem>
          <FormLabel className="text-sm font-medium">
            氏名
            {!nameLocked && <RequiredMark />}
          </FormLabel>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="姓"
                      className="h-10 text-sm"
                      disabled={nameLocked}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="名"
                      className="h-10 text-sm"
                      disabled={nameLocked}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          {nameLocked && (
            <p className="text-muted-foreground text-xs">本人による氏名の編集はできません</p>
          )}
        </FormItem>

        <FormItem>
          <FormLabel className="text-sm font-medium">英字表記</FormLabel>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="romajiLastName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Last Name"
                      className="h-10 text-sm"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="romajiFirstName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="First Name"
                      className="h-10 text-sm"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </FormItem>
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">ニックネーム</FormLabel>
              <FormControl>
                <Input
                  placeholder="表示用ニックネーム"
                  className="h-10 text-sm"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleClassifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                役割区分
                {!roleClassificationsLocked && <RequiredMark />}
              </FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-3">
                  {ROLE_OPTIONS.map((opt) => {
                    const checked = (field.value ?? []).includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 text-sm"
                        aria-disabled={roleClassificationsLocked}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={roleClassificationsLocked}
                          onCheckedChange={(next) => {
                            const current: string[] = field.value ?? [];
                            if (next) {
                              if (current.length >= 3) return;
                              field.onChange([...current, opt.value]);
                            } else {
                              field.onChange(current.filter((v) => v !== opt.value));
                            }
                          }}
                        />
                        <Badge
                          variant={checked ? 'secondary' : 'outline'}
                          className="text-xs font-normal"
                        >
                          {opt.label}
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              </FormControl>
              <p className="text-muted-foreground text-[11px]">複数選択可</p>
              {roleClassificationsLocked && (
                <p className="text-muted-foreground text-xs">
                  本人による役割区分の編集はできません
                </p>
              )}
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
