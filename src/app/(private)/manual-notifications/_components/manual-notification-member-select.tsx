'use client';

import { useState } from 'react';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce.hook';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmMembersInfiniteOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersResponse } from '@/lib/api/types.gen';

import {
  MANUAL_NOTIFICATION_BRAND_LABELS,
  MANUAL_NOTIFICATION_BRAND_OPTIONS,
} from '../_constants/manual-notification.constants';
import type { ManualNotificationFormValues } from '../_schemas/manual-notification-form.schema';

const CONTRACT_OPTIONS = ['レギュラー会員', 'プレミアム会員', 'ビジター会員', '法人会員'] as const;
const MEMBER_BRAND_OPTIONS = [
  'joyfit',
  'joyfit24',
  'joyfit_yoga',
  'joyfit_plus',
  'fit365',
] as const satisfies ReadonlyArray<(typeof MANUAL_NOTIFICATION_BRAND_OPTIONS)[number]>;

type Member = GetCrmMembersResponse['members'][number];
type MemberBrand = (typeof MEMBER_BRAND_OPTIONS)[number];
type ContractName = (typeof CONTRACT_OPTIONS)[number];
type SelectedMember = Extract<
  ManualNotificationFormValues['target'],
  { type: 'members' }
>['members'][number];

interface ManualNotificationMemberSelectProps {
  readonly value: SelectedMember[];
  readonly onChange: (value: SelectedMember[]) => void;
}

function toSelectedMember(member: Member): SelectedMember {
  return {
    id: member.id,
    name: member.name_kanji,
    memberNumber: member.member_number,
    storeName: member.store_name,
  };
}

export function ManualNotificationMemberSelect({
  value,
  onChange,
}: ManualNotificationMemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(value);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState<MemberBrand | 'all'>('all');
  const [contractType, setContractType] = useState<ContractName | 'all'>('all');
  const debouncedSearch = useDebounce(search, 300);
  const query = useInfiniteQuery({
    ...getCrmMembersInfiniteOptions({
      query: {
        page: 1,
        limit: 15,
        search: debouncedSearch || undefined,
        status: ['active'],
        brand: brand === 'all' ? undefined : [brand],
      },
    }),
    enabled: open,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: keepPreviousData,
  });
  const loadedMembers = query.data?.pages.flatMap((page) => page.members) ?? [];
  const members =
    contractType !== 'all'
      ? loadedMembers.filter((member) => member.contract_name === contractType)
      : loadedMembers;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) setPending(value);
  };

  const toggleMember = (member: Member, checked: boolean) => {
    setPending((current) =>
      checked
        ? [...current.filter((selected) => selected.id !== member.id), toSelectedMember(member)]
        : current.filter((selected) => selected.id !== member.id),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
          対象会員を選択する...
        </Button>
        {value.length > 0 ? (
          <span className="text-muted-foreground text-sm">{value.length}名選択中</span>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 5).map((member) => (
            <Badge key={member.id} variant="secondary" className="gap-1 pr-1 text-xs">
              {member.name}
              <button
                type="button"
                className="hover:bg-muted-foreground/20 ml-0.5 rounded-full p-0.5"
                onClick={() => onChange(value.filter((selected) => selected.id !== member.id))}
              >
                <X className="text-muted-foreground hover:text-foreground size-3" />
                <span className="sr-only">解除</span>
              </button>
            </Badge>
          ))}
          {value.length > 5 ? (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              +{value.length - 5}名
            </Badge>
          ) : null}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="h-[min(604px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[770px]">
          <DialogHeader className="p-5 pb-4">
            <DialogTitle>対象会員を選択</DialogTitle>
            <DialogDescription className="sr-only">配信対象の会員を選択します。</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 grid-cols-[2fr_1fr] border-t">
            <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-r">
              <div className="space-y-2 border-b p-3">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
                  <Input
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="会員番号または氏名で検索..."
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={brand}
                    onValueChange={(nextValue) => {
                      if (nextValue === 'all') {
                        setBrand('all');
                        return;
                      }
                      const value = MEMBER_BRAND_OPTIONS.find((option) => option === nextValue);
                      if (value) setBrand(value);
                    }}
                  >
                    <SelectTrigger className="bg-background h-8 w-[120px] text-xs">
                      <SelectValue>
                        {brand === 'all' ? '全ブランド' : MANUAL_NOTIFICATION_BRAND_LABELS[brand]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全ブランド</SelectItem>
                      {MEMBER_BRAND_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {MANUAL_NOTIFICATION_BRAND_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={contractType}
                    onValueChange={(nextValue) => {
                      const value = ['all', ...CONTRACT_OPTIONS].find(
                        (option) => option === nextValue,
                      ) as ContractName | 'all' | undefined;
                      if (value) setContractType(value);
                    }}
                  >
                    <SelectTrigger className="bg-background h-8 w-[125px] text-xs">
                      <SelectValue>
                        {contractType === 'all' ? '全契約種別' : contractType}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全契約種別</SelectItem>
                      {CONTRACT_OPTIONS.map((contract) => (
                        <SelectItem key={contract} value={contract}>
                          {contract}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div
                className="h-full min-h-0 space-y-1 overflow-y-auto p-2"
                onScroll={(event) => {
                  const element = event.currentTarget;
                  const reachedBottom =
                    element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
                  if (reachedBottom && query.hasNextPage && !query.isFetchingNextPage) {
                    void query.fetchNextPage();
                  }
                }}
              >
                {query.isLoading ? (
                  <p className="text-muted-foreground p-4 text-center text-xs">
                    会員を読み込み中...
                  </p>
                ) : null}
                {query.isError ? (
                  <p className="text-destructive p-4 text-center text-xs">
                    会員の取得に失敗しました
                  </p>
                ) : null}
                {!query.isLoading && !query.isError && members.length === 0 ? (
                  <p className="text-muted-foreground p-4 text-center text-xs">
                    会員が見つかりません
                  </p>
                ) : null}
                {members.map((member) => (
                  <label
                    key={member.id}
                    className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md p-2"
                  >
                    <Checkbox
                      checked={pending.some((selected) => selected.id === member.id)}
                      onCheckedChange={(checked) => toggleMember(member, Boolean(checked))}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{member.name_kanji}</span>
                      <span className="text-muted-foreground text-xs">
                        {member.member_number} / {member.store_name}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-muted-foreground border-t px-3 py-2 text-xs">
                {members.length}件表示中
              </p>
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-medium">選択中</span>
                <span className="text-muted-foreground text-xs">{pending.length}件</span>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto p-3">
                {pending.map((member) => (
                  <div
                    key={member.id}
                    className="bg-muted/40 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
                  >
                    <span className="truncate">{member.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setPending((current) =>
                          current.filter((selected) => selected.id !== member.id),
                        )
                      }
                    >
                      <X className="size-3" />
                      <span className="sr-only">解除</span>
                    </button>
                  </div>
                ))}
                {pending.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-xs">
                    選択されていません
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <DialogFooter className="m-0 rounded-none border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={() => {
                onChange(pending);
                setOpen(false);
              }}
            >
              確定（{pending.length}件）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
