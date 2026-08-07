'use client';

import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  EQUIPMENT_MAIN_CONTRACT_TYPE_OPTIONS,
  EQUIPMENT_OPTION_TYPE_OPTIONS,
  EQUIPMENT_PER_USE_OPTION_TYPE_OPTIONS,
} from '../_constants/constants';
import type { EquipmentFormValues } from '../_schemas/equipment-form.schema';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export function EquipmentFormUsageRule() {
  const form = useFormContext<EquipmentFormValues>();

  const mainEnabled = form.watch('usage_control_rule.main_enabled');
  const optionEnabled = form.watch('usage_control_rule.option_enabled');
  const perUseEnabled = form.watch('usage_control_rule.per_use_enabled');
  const isGate = form.watch('equipment_type') === 'entry_gate';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">利用制御ルール</CardTitle>
        <p className="text-muted-foreground mt-1 text-xs">
          起動許可の条件となる契約種別を選択してください（複数選択可・いずれか1つを満たせば起動許可）
        </p>
      </CardHeader>
      <CardContent className="px-6">
        <div className="space-y-4">
          {/* 主契約判定 */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="usage_control_rule.main_enabled"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      id="rule-main"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        field.onChange(isChecked);
                        if (!isChecked) {
                          form.setValue('usage_control_rule.main_contract_type', null, {
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <Label htmlFor="rule-main" className="cursor-pointer text-sm font-medium">
                    主契約判定
                  </Label>
                </div>
              )}
            />
            {mainEnabled ? (
              <div className="ml-6">
                <FormField
                  control={form.control}
                  name="usage_control_rule.main_contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        主契約タイプ
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {EQUIPMENT_MAIN_CONTRACT_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </div>

          {/* オプション契約判定 */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="usage_control_rule.option_enabled"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      id="rule-option"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        field.onChange(isChecked);
                        if (!isChecked) {
                          form.setValue('usage_control_rule.option_type', null, {
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <Label htmlFor="rule-option" className="cursor-pointer text-sm font-medium">
                    オプション契約判定
                  </Label>
                </div>
              )}
            />
            {optionEnabled ? (
              <div className="ml-6">
                <FormField
                  control={form.control}
                  name="usage_control_rule.option_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        オプション種別
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {EQUIPMENT_OPTION_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </div>

          {/* 都次オプション判定 */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="usage_control_rule.per_use_enabled"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      id="rule-per-use"
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        field.onChange(isChecked);
                        if (!isChecked) {
                          form.setValue('usage_control_rule.per_use_option_type', null, {
                            shouldDirty: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <Label htmlFor="rule-per-use" className="cursor-pointer text-sm font-medium">
                    都次オプション判定
                  </Label>
                </div>
              )}
            />
            {perUseEnabled ? (
              <div className="ml-6">
                <FormField
                  control={form.control}
                  name="usage_control_rule.per_use_option_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        都次オプション種別
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {EQUIPMENT_PER_USE_OPTION_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </div>

          {/* ゲートストップ条件（入退館ゲートのみ・表示のみ） */}
          {isGate ? (
            <div className="bg-info/15 border-info/20 rounded-md border px-4 py-3">
              <p className="text-info text-xs font-medium">
                入退館ゲートのゲートストップ条件（自動適用）
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                以下の条件に該当する会員はゲートストップが自動適用されます: ① ブラックリスト登録済み
                ② 未納（滞納） ③ 家族会員利用中
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
