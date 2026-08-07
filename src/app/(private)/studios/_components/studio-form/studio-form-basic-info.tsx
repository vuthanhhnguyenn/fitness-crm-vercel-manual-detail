'use client';

import { useFormContext } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';

import type { StudioFormValues } from '../studio-form.schema';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

const STUDIO_TYPE_LABELS: Record<string, string> = {
  normal: 'ノーマル',
  hot_yoga: 'ホットヨガ',
  virtual: 'バーチャル',
};

export function StudioFormBasicInfo() {
  const form = useFormContext<StudioFormValues>();

  const { data } = useQuery({
    ...getCrmStoresOptions({
      query: { limit: 100 },
    }),
  });

  const stores = data?.stores ?? [];

  return (
    <>
      <h2 className="mb-4 text-base font-bold">基本情報</h2>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="storeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                店舗名
                <RequiredMark />
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="選択してください">
                      {field.value
                        ? stores.find((store) => store.id === field.value)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                スタジオ名
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input placeholder="スタジオ名を入力" className="h-10 text-sm" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="studioType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                スタジオ区分
                <RequiredMark />
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="選択してください">
                      {field.value ? STUDIO_TYPE_LABELS[field.value] : undefined}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="normal">ノーマル</SelectItem>
                  <SelectItem value="hot_yoga">ホットヨガ</SelectItem>
                  <SelectItem value="virtual">バーチャル</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="operatingHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">利用可能時間</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <Input
                    className="h-10 w-auto text-sm"
                    type="time"
                    value={field.value ? (field.value.split('~')[0] ?? '') : ''}
                    onChange={(e) => {
                      const end = field.value ? (field.value.split('~')[1] ?? '') : '';
                      field.onChange(e.target.value ? `${e.target.value}~${end}` : '');
                    }}
                  />
                  <span className="text-muted-foreground">〜</span>
                  <Input
                    className="h-10 w-auto text-sm"
                    type="time"
                    value={field.value ? (field.value.split('~')[1] ?? '') : ''}
                    onChange={(e) => {
                      const start = field.value ? (field.value.split('~')[0] ?? '') : '';
                      field.onChange(e.target.value ? `${start}~${e.target.value}` : '');
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                物理定員
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-10 w-32 text-sm"
                    type="number"
                    min={1}
                    max={500}
                    placeholder="物理定員"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                  />
                  <span className="text-muted-foreground text-sm">名</span>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bufferValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                バッファ値
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-10 w-32 text-sm"
                    type="number"
                    min={0}
                    max={500}
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                  <span className="text-muted-foreground text-sm">名</span>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
