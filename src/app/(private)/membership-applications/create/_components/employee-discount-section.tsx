'use client';

import type { Control } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmMembershipApplicationsCorporateMastersOptions } from '@/lib/api/@tanstack/react-query.gen';

import { ImageUpload } from '../../../../../components/common/image-upload';
import type { DirectEnrollmentFormValues } from './enrollment-form';

interface EmployeeDiscountSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly onUploadingChange?: (uploading: boolean) => void;
}

export function EmployeeDiscountSection({
  control,
  onUploadingChange,
}: EmployeeDiscountSectionProps) {
  const { data } = useQuery(getCrmMembershipApplicationsCorporateMastersOptions());
  const partnerCompanies = data?.items ?? [];
  const partnerCompanyItems = partnerCompanies.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const now = format(new Date(), 'yyyy/MM/dd HH:mm');

  return (
    <Card>
      <CardHeader>
        <CardTitle>社員割引確認事項</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Partner company */}
          <FormField
            control={control}
            name="employee_discount.partner_company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  提携企業<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  items={partnerCompanyItems}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {partnerCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Employee number */}
          <FormField
            control={control}
            name="employee_discount.employee_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  社員番号<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="例: EMP-12345" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Document verification */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">書類確認</span>
          <FormField
            control={control}
            name="employee_discount.employee_id_verified"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="employee-id-verified"
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                  />
                  <Label htmlFor="employee-id-verified">
                    社員証（有効期限内）を目視確認しました
                  </Label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="employee_discount.employment_cert_verified"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="employment-cert-verified"
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                  />
                  <Label htmlFor="employment-cert-verified">在籍証明書を確認しました</Label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Image uploads */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="employee_discount.employee_id_image_url"
            render={({ field, fieldState }) => (
              <FormItem>
                <ImageUpload
                  value={field.value ?? null}
                  onChange={(url) => field.onChange(url ?? undefined)}
                  onUploadingChange={onUploadingChange}
                  label="社員証画像（任意・推奨）"
                  hasError={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="employee_discount.employment_cert_image_url"
            render={({ field, fieldState }) => (
              <FormItem>
                <ImageUpload
                  value={field.value ?? null}
                  onChange={(url) => field.onChange(url ?? undefined)}
                  onUploadingChange={onUploadingChange}
                  label="在籍証明書画像（任意・推奨）"
                  hasError={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Readonly info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">確認日時</span>
            <span className="text-muted-foreground text-sm">{now}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">確認担当者</span>
            <span className="text-muted-foreground text-sm">管理者A（STAFF-001）</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
