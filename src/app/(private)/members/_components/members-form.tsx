'use client';

import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Image from 'next/image';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Camera, ChevronsUpDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmMembersMetaMainContractLabelsOptions,
  getCrmMembersOptions,
  getCrmStoresOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { Brand, Gender, MemberType } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { BRAND_LABELS, GENDER_LABELS, MEMBER_TYPE_LABELS } from '../_constants/constants';
import { JOIN_ROUTE_OPTIONS, type MemberFormValues } from '../_schemas/member-form.schema';

const EMERGENCY_CONTACT_RELATIONSHIP_OPTIONS = [
  { value: '父', label: '父' },
  { value: '母', label: '母' },
  { value: '配偶者', label: '配偶者' },
  { value: '兄弟姉妹', label: '兄弟姉妹' },
  { value: 'その他', label: 'その他' },
];

export function MembersForm() {
  const form = useFormContext<MemberFormValues>();
  const joinRoute = useWatch({ control: form.control, name: 'join_route' });
  const memberPhotoUrl = useWatch({ control: form.control, name: 'member_photo_url' });
  const [memberTypeOpen, setMemberTypeOpen] = useState(false);
  const [referrerOpen, setReferrerOpen] = useState(false);

  const { data: membersList } = useQuery({
    ...getCrmMembersOptions({
      query: {
        limit: 200,
        page: 1,
      },
    }),
  });

  const { data: mainContractLabelsRes } = useQuery({
    ...getCrmMembersMetaMainContractLabelsOptions(),
  });
  const mainContractLabels = mainContractLabelsRes?.labels ?? [];
  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 100,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
  });
  const storeOptions = (storesRes?.stores ?? []).map((store) => ({
    value: store.id,
    label: store.name,
  }));

  const referrerCandidates = useMemo(
    () =>
      (membersList?.members ?? []).map((member) => ({
        id: member.id,
        name: member.name_kanji,
        storeName: member.store_name,
      })),
    [membersList?.members],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-4">
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-4">
          <div className="space-y-2">
            <FormLabel>会員写真</FormLabel>
            <div className="flex items-center gap-4">
              <label className="bg-muted/50 hover:bg-muted border-border relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors">
                {memberPhotoUrl ? (
                  <Image
                    src={memberPhotoUrl}
                    alt="会員写真プレビュー"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <Camera className="text-muted-foreground size-6" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      form.setValue('member_photo_url', String(reader.result), {
                        shouldDirty: true,
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <p className="text-muted-foreground text-xs">クリックして写真をアップロード</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    氏名（姓）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 山田" {...field} />
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
                    氏名（名）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="last_name_kana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    フリガナ（姓）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: ヤマダ" {...field} />
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
                    フリガナ（名）<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: タロウ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    生年月日<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      placeholder="日付を選択"
                      onDateChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
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
                    性別<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    key={`gender-${field.value ?? 'empty'}`}
                    items={GENDER_LABELS}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Gender).map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {GENDER_LABELS[gender]}
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
            name="member_type"
            render={({ field }) => (
              <FormItem className="max-w-[400px]">
                <FormLabel>会員種別</FormLabel>
                <Popover open={memberTypeOpen} onOpenChange={setMemberTypeOpen}>
                  <PopoverTrigger
                    render={
                      <FormControl>
                        <button
                          type="button"
                          aria-expanded={memberTypeOpen}
                          className={cn(
                            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm',
                          )}
                        >
                          {field.value
                            ? MEMBER_TYPE_LABELS[field.value as MemberType]
                            : '会員種別を選択'}
                          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                        </button>
                      </FormControl>
                    }
                  ></PopoverTrigger>
                  <PopoverContent className="w-(--anchor-width) p-0" align="start">
                    <Command>
                      <CommandInput placeholder="会員種別を検索..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>該当なし</CommandEmpty>
                        <CommandGroup>
                          {Object.values(MemberType).map((option) => (
                            <CommandItem
                              key={option}
                              value={option}
                              data-checked={field.value === option}
                              onSelect={(value) => {
                                field.onChange(value === field.value ? '' : value);
                                setMemberTypeOpen(false);
                              }}
                            >
                              {MEMBER_TYPE_LABELS[option]}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4">
          <CardTitle className="text-base">連絡先</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    電話番号<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例: 090-1234-5678" {...field} />
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
                    メールアドレス<span className="text-destructive ml-0.5">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="例: yamada@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem className="md:max-w-[220px]">
                <FormLabel>郵便番号</FormLabel>
                <FormControl>
                  <Input placeholder="例: 150-0001" {...field} />
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
                  <Input placeholder="例: 東京都渋谷区神宮前1-1-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>緊急連絡先名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 山田花子" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>緊急連絡先電話番号</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 090-9876-5432" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="emergency_contact_relationship"
            render={({ field }) => (
              <FormItem className="max-w-[400px]">
                <FormLabel>続柄</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  key={`emergency-contact-relationship-${field.value ?? 'empty'}`}
                  items={EMERGENCY_CONTACT_RELATIONSHIP_OPTIONS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMERGENCY_CONTACT_RELATIONSHIP_OPTIONS.map((item) => (
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4">
          <CardTitle className="text-base">契約情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contract_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  主契約<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={mainContractLabels.length === 0}
                  key={`contract-name-${field.value ?? 'empty'}`}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mainContractLabels.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="join_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  入会日<span className="text-destructive ml-0.5">*</span>
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
            control={form.control}
            name="join_store"
            render={({ field }) => (
              <FormItem>
                <FormLabel>入会店舗</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  key={`join-store-${field.value ?? 'empty'}`}
                  items={storeOptions}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {storeOptions.map((store) => (
                      <SelectItem key={store.value} value={store.value}>
                        {store.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ブランド</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  key={`brand-${field.value ?? 'empty'}`}
                  items={BRAND_LABELS}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Brand).map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {BRAND_LABELS[brand]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="join_route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>入会経路</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  key={`join-route-${field.value ?? 'empty'}`}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {JOIN_ROUTE_OPTIONS.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {joinRoute === '紹介' && (
            <FormField
              control={form.control}
              name="referrer_member_id"
              render={({ field }) => {
                const selected = referrerCandidates.find(
                  (candidate) => candidate.id === field.value,
                );

                return (
                  <FormItem>
                    <FormLabel>紹介者</FormLabel>
                    <Popover open={referrerOpen} onOpenChange={setReferrerOpen}>
                      <PopoverTrigger
                        render={
                          <FormControl>
                            <button
                              type="button"
                              aria-expanded={referrerOpen}
                              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm"
                            >
                              {selected
                                ? `${selected.name}（${selected.id}）`
                                : '紹介者を検索（会員ID・氏名）'}
                              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                            </button>
                          </FormControl>
                        }
                      ></PopoverTrigger>
                      <PopoverContent className="w-(--anchor-width) p-0" align="start">
                        <Command>
                          <CommandInput placeholder="会員IDまたは氏名で検索" className="h-9" />
                          <CommandList>
                            <CommandEmpty>該当なし</CommandEmpty>
                            <CommandGroup>
                              {referrerCandidates.map((candidate) => (
                                <CommandItem
                                  key={candidate.id}
                                  value={`${candidate.id} ${candidate.name}`}
                                  data-checked={field.value === candidate.id}
                                  onSelect={() => {
                                    field.onChange(
                                      candidate.id === field.value ? '' : candidate.id,
                                    );
                                    setReferrerOpen(false);
                                  }}
                                >
                                  <span
                                    className={cn(
                                      'bg-muted-foreground/40 size-2 shrink-0 rounded-full',
                                    )}
                                  />
                                  <span className="text-sm font-medium">{candidate.name}</span>
                                  <span className="text-muted-foreground font-mono text-xs">
                                    {candidate.id}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {candidate.storeName}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4">
          <CardTitle className="text-base">備考</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>備考</FormLabel>
                <FormControl>
                  <Textarea placeholder="備考を入力してください" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
