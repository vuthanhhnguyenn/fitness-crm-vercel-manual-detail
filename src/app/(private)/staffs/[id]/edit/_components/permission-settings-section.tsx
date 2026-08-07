'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmPositionsOptions } from '@/lib/api/@tanstack/react-query.gen';

import { STAFF_BRAND_LABELS } from '../../../_constants/constants';
import { staffRoleFromPositionRoleCategory } from '../../../_utils/position-role.util';
import type { StaffEditFormValues } from '../_schemas/staff-edit-form.schema';

const STORES = [
  { value: 'all_stores', label: '全店舗' },
  { value: 'store-001', label: '全店舗' },
  { value: 'store-002', label: 'JOYFIT新宿店' },
  { value: 'store-003', label: 'JOYFIT24梅田店' },
  { value: 'store-004', label: 'FIT365八潮店' },
];

export function PermissionSettingsSection() {
  const form = useFormContext<StaffEditFormValues>();
  const { data: positionsRes, isLoading: positionsLoading } = useQuery({
    ...getCrmPositionsOptions(),
  });
  const positions = positionsRes?.positions ?? [];
  const positionId = form.watch('position_id');
  const positionInList = positions.some((p) => p.id === positionId);

  const { fields, append, remove } = useFieldArray({
    name: 'editable_scopes',
    control: form.control,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>権限設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ─── 職位 (API master, required, left half) — syncs permission_settings.role ─── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="position_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  職位<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  value={field.value != null ? String(field.value) : ''}
                  onValueChange={(value) => {
                    const strValue = value ?? '';
                    const id = Number.parseInt(strValue, 10);
                    field.onChange(Number.isNaN(id) ? undefined : id);
                    const pos = positions.find((p) => p.id === id);
                    if (pos) {
                      form.setValue('role', staffRoleFromPositionRoleCategory(pos.role));
                    }
                  }}
                  disabled={positionsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={positionsLoading ? '読み込み中…' : '選択'}>
                        {field.value != null
                          ? (positions.find((p) => p.id === field.value)?.position_name ??
                            (!positionInList
                              ? positionsLoading
                                ? '読み込み中…'
                                : `職位 #${field.value}`
                              : undefined))
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.value != null && !positionInList ? (
                      <SelectItem value={String(field.value)}>
                        {positionsLoading ? '読み込み中…' : `職位 #${field.value}`}
                      </SelectItem>
                    ) : null}
                    {positions.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.position_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ─── 追加権限 checkboxes (vertical list) ─── */}
        <div className="space-y-1">
          <p className="text-sm leading-none font-medium">追加権限</p>
          <div className="space-y-2 pt-2">
            <FormField
              control={form.control}
              name="billing_correction"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="mt-0! font-normal">確定請求訂正</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="refund_request"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="mt-0! font-normal">返金申請</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transfer_request"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="mt-0! font-normal">移籍申請・否認</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ─── 編集可能情報 table ─── */}
        <div className="space-y-3">
          <p className="text-sm leading-none font-medium">編集可能情報</p>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-100">
                  <TableHead>
                    <span className="text-xs font-semibold">ブランド </span>
                  </TableHead>
                  <TableHead>
                    <span className="text-xs font-semibold">対象</span>
                  </TableHead>
                  <TableHead>
                    <span className="text-xs font-semibold">有効開始日</span>
                  </TableHead>
                  <TableHead>
                    <span className="text-xs font-semibold">有効終了日</span>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    {/* ブランド */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`editable_scopes.${index}.brand`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <Select
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              items={STAFF_BRAND_LABELS}
                            >
                              <FormControl>
                                <SelectTrigger aria-invalid={!!fieldState.error}>
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(STAFF_BRAND_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* 対象 — 全店舗 or specific store */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`editable_scopes.${index}.target`}
                        render={({ field, fieldState }) => {
                          const currentStoreId = form.getValues(
                            `editable_scopes.${index}.store_id`,
                          );
                          const compositeValue =
                            field.value === 'specific_store' && currentStoreId
                              ? currentStoreId
                              : 'all_stores';

                          const handleChange = (val: string | null) => {
                            const newVal = val ?? 'all_stores';
                            if (newVal === 'all_stores') {
                              field.onChange('all_stores');
                              form.setValue(`editable_scopes.${index}.store_id`, '');
                              form.setValue(`editable_scopes.${index}.store_name`, '');
                            } else {
                              const store = STORES.find((s) => s.value === newVal);
                              field.onChange('specific_store');
                              form.setValue(`editable_scopes.${index}.store_id`, newVal);
                              form.setValue(
                                `editable_scopes.${index}.store_name`,
                                store?.label ?? '',
                              );
                            }
                          };

                          return (
                            <FormItem>
                              <Select
                                value={compositeValue}
                                onValueChange={handleChange}
                                items={STORES}
                              >
                                <FormControl>
                                  <SelectTrigger aria-invalid={!!fieldState.error}>
                                    <SelectValue placeholder="選択" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {STORES.map((store) => (
                                    <SelectItem key={store.value} value={store.value}>
                                      {store.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          );
                        }}
                      />
                    </TableCell>

                    {/* 有効開始日 */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`editable_scopes.${index}.start_date`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <DatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              placeholder="日付を選択"
                              hasError={!!fieldState.error}
                              onDateChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                            />
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* 有効終了日 */}
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`editable_scopes.${index}.end_date`}
                        render={({ field, fieldState }) => {
                          const startDateStr = form.watch(`editable_scopes.${index}.start_date`);
                          return (
                            <FormItem>
                              <DatePicker
                                date={field.value ? new Date(field.value) : undefined}
                                placeholder="日付を選択"
                                hasError={!!fieldState.error}
                                disabledDate={
                                  startDateStr ? (date) => date < new Date(startDateStr) : undefined
                                }
                                onDateChange={(d) =>
                                  field.onChange(d ? format(d, 'yyyy-MM-dd') : '')
                                }
                              />
                            </FormItem>
                          );
                        }}
                      />
                    </TableCell>

                    {/* 削除 */}
                    <TableCell>
                      {fields.length >= 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {Array.isArray(form.formState.errors.editable_scopes) &&
            form.formState.errors.editable_scopes.some(
              (e) => e?.end_date?.message === '開始日は終了日より前にしてください',
            ) && <p className="text-destructive text-sm">開始日は終了日より前にしてください</p>}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                brand: 'all',
                target: 'all_stores',
                store_id: '',
                store_name: '',
                start_date: '',
                end_date: '',
              })
            }
          >
            <Plus className="mr-1 size-4" />
            行を追加
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
