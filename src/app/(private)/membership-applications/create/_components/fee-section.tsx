'use client';

import type { Control, UseFormSetValue } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

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
import { Separator } from '@/components/ui/separator';

import type {
  DirectEnrollmentFormValues,
  EnrollmentFeeMaster,
} from '../_schemas/enrollment-form.schema';

interface FeeSectionProps {
  readonly control: Control<DirectEnrollmentFormValues>;
  readonly setValue: UseFormSetValue<DirectEnrollmentFormValues>;
  readonly brand: 'FIT365' | 'JOYFIT' | '';
  readonly applicationType: string;
  readonly feeMasters: EnrollmentFeeMaster[];
}

export function FeeSection({
  control,
  setValue,
  brand,
  applicationType,
  feeMasters,
}: FeeSectionProps) {
  const fees = useWatch({ control, name: 'fees' });

  const total = Object.values(fees ?? {})
    .filter((v): v is number => typeof v === 'number')
    .reduce((a, b) => a + b, 0);

  if (!brand) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>入会金・先払い費用</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            ブランドを選択すると費用項目が切り替わります
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>入会金・先払い費用</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {brand === 'FIT365' ? (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="fees.card_issuance_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    カード発行料<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 5,500"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <p className="text-muted-foreground min-h-4 text-xs">FIT365: 税別5,000円</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fees.first_month_fee_prorated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    初月会費（日割）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 990"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <p className="text-muted-foreground min-h-4 text-xs" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fees.next_month_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    翌月会費<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 7,700"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="fees.enrollment_fee_master_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    入会金（マスタ参照）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select
                    disabled={!brand || !applicationType}
                    onValueChange={(v) => {
                      field.onChange(v);
                      const master = feeMasters.find((m) => m.id === v);
                      if (master) {
                        setValue('fees.enrollment_fee_amount', master.amount);
                      }
                    }}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !brand || !applicationType
                              ? 'ブランド・申請種別を選択してください'
                              : '入会金を選択'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feeMasters.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}（¥{m.amount.toLocaleString()}）
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fees.enrollment_fee_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    金額（マスタから自動適用）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      value={field.value === undefined ? '' : `¥${field.value.toLocaleString()}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fees.registration_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    登録事務手数料<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 3,300"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">JOYFIT: 税別3,000円</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fees.first_month_fee_prorated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    初月会費（日割）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 990"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fees.next_month_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    翌月会費<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 7,700"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        <Separator />
        <div className="flex justify-end text-sm font-medium">合計 ¥{total.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
