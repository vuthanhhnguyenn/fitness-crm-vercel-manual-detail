'use client';

// Client component: react-hook-form context + Select interaction
import { useFormContext } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { toSelectItems } from '@/utils/app.util';

import { RequiredMark } from '@/components/common/field-marker';
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
import { Textarea } from '@/components/ui/textarea';

import { POSITION_ROLE_OPTIONS } from '../../_constants/position.constants';
import { type PositionFormValues, applyCsvRoleDefaults } from '../../_schemas/position-form.schema';

const ROLE_ITEMS = toSelectItems(
  POSITION_ROLE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
);

type PositionFormBasicInfoSectionProps = {
  /**
   * ロールは作成後不変 (Clarification Q3): edit モードでは select を disabled にする。
   * V0プロトタイプからの意図的な差分（parity.md PAR059 note）。
   */
  isRoleLocked: boolean;
  /** CSVロール別デフォルトの再シードは「新規作成（prefillなし）」のみ (FR-011) */
  seedCsvDefaultsOnRoleChange: boolean;
};

export function PositionFormBasicInfoSection({
  isRoleLocked,
  seedCsvDefaultsOnRoleChange,
}: Readonly<PositionFormBasicInfoSectionProps>) {
  const form = useFormContext<PositionFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="position_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  職位名
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="例: 正社員（フロント）" maxLength={100} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  対象ロール
                  <RequiredMark />
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  この職位が属するロールを選択します。ロールにより利用できる機能の範囲が決まります
                </p>
                <Select
                  items={ROLE_ITEMS}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (seedCsvDefaultsOnRoleChange && value) {
                      form.setValue(
                        'permissions',
                        applyCsvRoleDefaults(form.getValues('permissions'), value),
                        { shouldDirty: true },
                      );
                    }
                  }}
                  disabled={isRoleLocked}
                >
                  <FormControl>
                    <SelectTrigger className="max-w-[280px]">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {POSITION_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">説明</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="職位の説明を入力（任意）"
                    className="min-h-[80px] text-sm leading-relaxed"
                    maxLength={TEXTAREA_MAX_LENGTH}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
