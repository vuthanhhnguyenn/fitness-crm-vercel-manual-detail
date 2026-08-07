'use client';

import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import {
  getCrmMembersByIdOptions,
  getCrmMembersOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmLockersContractsByIdResponse,
  GetCrmMembersResponse,
} from '@/lib/api/types.gen';

import type { LockerContractFormValues } from '../_schemas/locker-contract-form.schema';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];
type MemberListItem = NonNullable<GetCrmMembersResponse>['members'][number];

const MEMBER_SEARCH_LIMIT = 20;
const MEMBER_CACHE_MS = 5 * 60 * 1000;

type LockerContractMemberSectionProps = {
  mode: 'create' | 'edit';
  contract?: LockerContractDetail;
};

export function LockerContractMemberSection({ mode, contract }: LockerContractMemberSectionProps) {
  const form = useFormContext<LockerContractFormValues>();
  const memberId = useWatch({ control: form.control, name: 'member_id' });
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const isEdit = mode === 'edit';

  const { data: membersData, isFetching: isMembersFetching } = useQuery({
    ...getCrmMembersOptions({
      query: {
        page: 1,
        limit: MEMBER_SEARCH_LIMIT,
        search: memberSearchQuery || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: !isEdit && isMemberPopoverOpen,
    staleTime: MEMBER_CACHE_MS,
  });

  const members = membersData?.members ?? [];
  const selectedMemberFromOptions = memberId
    ? members.find((member) => member.id === memberId)
    : undefined;

  const { data: selectedMemberRes } = useQuery({
    ...getCrmMembersByIdOptions({ path: { id: memberId } }),
    enabled: Boolean(memberId) && !isEdit && !selectedMemberFromOptions,
    staleTime: MEMBER_CACHE_MS,
  });

  const selectedMemberLabel = useMemo(() => {
    if (!memberId || isEdit) return undefined;

    const name =
      selectedMemberFromOptions?.name_kanji ??
      selectedMemberRes?.basic_info?.name_kanji ??
      undefined;

    return name ? `${name}（${memberId}）` : memberId;
  }, [
    isEdit,
    memberId,
    selectedMemberFromOptions?.name_kanji,
    selectedMemberRes?.basic_info?.name_kanji,
  ]);

  const selectedMember = useMemo(() => {
    if (isEdit || !memberId) return undefined;

    if (selectedMemberFromOptions) {
      return {
        id: selectedMemberFromOptions.id,
        name: selectedMemberFromOptions.name_kanji,
        phone: selectedMemberFromOptions.phone,
        email: selectedMemberFromOptions.email,
      };
    }

    const basicInfo = selectedMemberRes?.basic_info;
    if (!basicInfo) return undefined;

    return {
      id: basicInfo.id,
      name: basicInfo.name_kanji,
      phone: basicInfo.phone,
      email: basicInfo.email,
    };
  }, [isEdit, memberId, selectedMemberFromOptions, selectedMemberRes?.basic_info]);

  const displayMember = isEdit
    ? {
        id: contract?.member_id ?? '',
        name: contract?.member_name ?? '',
        phone: contract?.member_phone ?? '',
        email: contract?.member_email ?? '',
      }
    : selectedMember;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">契約者情報</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {!isEdit ? (
          <FormField
            control={form.control}
            name="member_id"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>
                  会員<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <SearchableSelect<MemberListItem>
                    value={field.value || null}
                    valueLabel={selectedMemberLabel}
                    options={members}
                    placeholder="会員を選択してください"
                    searchPlaceholder="会員IDまたは氏名で検索"
                    emptyMessage="該当なし"
                    loadingMessage="会員を読み込み中..."
                    isLoading={isMembersFetching}
                    open={isMemberPopoverOpen}
                    onOpenChange={setIsMemberPopoverOpen}
                    onSearchChange={setMemberSearchQuery}
                    onSelect={(member) => field.onChange(member?.id ?? '')}
                    getOptionKey={(member) => member.id}
                    getOptionLabel={(member) => `${member.name_kanji}（${member.id}）`}
                    getOptionKeywords={(member) =>
                      [
                        member.name_kanji,
                        member.name_kana,
                        member.id,
                        member.member_number,
                        member.phone,
                        member.email,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    }
                    renderOption={(member) => (
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">{member.name_kanji}</span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-muted-foreground font-mono text-xs">
                            {member.id}
                          </span>
                          <span className="text-muted-foreground text-xs">{member.store_name}</span>
                        </div>
                      </div>
                    )}
                    triggerClassName="h-8 w-full text-sm font-normal"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {displayMember?.id ? (
          <div className="bg-muted/50 rounded-lg border px-4 py-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-muted-foreground text-xs">会員ID</p>
                <p className="text-sm font-medium">{displayMember.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">氏名</p>
                <p className="text-sm font-medium">{displayMember.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">電話番号</p>
                <p className="text-sm">{displayMember.phone || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">メール</p>
                <p className="text-sm">{displayMember.email || '—'}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">会員を選択すると情報が表示されます。</p>
        )}
      </CardContent>
    </Card>
  );
}
