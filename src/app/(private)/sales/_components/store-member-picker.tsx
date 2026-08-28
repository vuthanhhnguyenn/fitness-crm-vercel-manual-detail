'use client';

import { useState } from 'react';
import { type Control, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { SearchableSelect } from '@/components/common/searchable-select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import {
  getCrmStoresByStoreIdMembersOptions,
  getCrmStoresOptions,
} from '@/lib/api/@tanstack/react-query.gen';

import type { ManualRegistrationFormValues } from '../_schemas/manual-registration-form.schema';

interface StoreMemberPickerProps {
  control: Control<ManualRegistrationFormValues>;
  onStoreChange: () => void;
  onMemberChange: () => void;
}

interface StoreOption {
  id: string;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
  has_unpaid: boolean;
}

function matchesQuery(query: string, ...fields: string[]): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field.toLowerCase().includes(needle));
}

export function StoreMemberPicker({
  control,
  onStoreChange,
  onMemberChange,
}: Readonly<StoreMemberPickerProps>) {
  const storeId = useWatch({ control, name: 'store_id' });

  const [storeOpen, setStoreOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const { data: storesRes } = useQuery(getCrmStoresOptions());
  const stores: StoreOption[] = storesRes?.stores ?? [];
  const filteredStores = stores.filter((store) => matchesQuery(storeSearch, store.name, store.id));

  const { data: membersRes } = useQuery({
    ...getCrmStoresByStoreIdMembersOptions({ path: { storeId: storeId || '' } }),
    enabled: Boolean(storeId),
  });
  const members: MemberOption[] = membersRes?.members ?? [];
  const filteredMembers = members.filter((member) =>
    matchesQuery(memberSearch, member.name, member.id),
  );

  return (
    <>
      <FormField
        control={control}
        name="store_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              店舗<span className="text-destructive ml-0.5">*</span>
            </FormLabel>
            <FormControl>
              <SearchableSelect<StoreOption>
                value={field.value || null}
                options={filteredStores}
                placeholder="店舗を選択"
                searchPlaceholder="店舗名・IDで検索..."
                emptyMessage="該当なし"
                open={storeOpen}
                onOpenChange={setStoreOpen}
                onSearchChange={setStoreSearch}
                onSelect={(store) => {
                  field.onChange(store?.id ?? '');
                  onStoreChange();
                }}
                getOptionKey={(store) => store.id}
                getOptionLabel={(store) => store.name}
                getOptionKeywords={(store) => `${store.name} ${store.id}`}
                triggerClassName="h-9 w-full justify-between"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="member_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              利用者<span className="text-destructive ml-0.5">*</span>
            </FormLabel>
            <FormControl>
              <SearchableSelect<MemberOption>
                value={field.value || null}
                options={filteredMembers}
                placeholder={storeId ? '利用者を選択' : '先に店舗を選択してください'}
                searchPlaceholder="氏名・IDで検索..."
                emptyMessage="該当する利用者がいません"
                disabled={!storeId}
                open={memberOpen}
                onOpenChange={setMemberOpen}
                onSearchChange={setMemberSearch}
                onSelect={(member) => {
                  field.onChange(member?.id ?? '');
                  onMemberChange();
                }}
                getOptionKey={(member) => member.id}
                getOptionLabel={(member) => `${member.id}: ${member.name}`}
                getOptionKeywords={(member) => `${member.name} ${member.id}`}
                renderOption={(member) => (
                  <span className="block min-w-0 flex-1 truncate">
                    {member.id}: {member.name}
                    {member.has_unpaid && (
                      <span className="text-destructive ml-1">（未納あり）</span>
                    )}
                  </span>
                )}
                triggerClassName="h-9 w-full justify-between"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
