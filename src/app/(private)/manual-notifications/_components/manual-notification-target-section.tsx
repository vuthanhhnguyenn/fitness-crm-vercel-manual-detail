'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Bell, ChevronsUpDown, Users } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce.hook';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmMainContractsOptions,
  getCrmStoresInfiniteOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import {
  MANUAL_NOTIFICATION_BRAND_LABELS,
  MANUAL_NOTIFICATION_BRAND_OPTIONS,
  MANUAL_NOTIFICATION_DYNAMIC_ATTRIBUTE_OPTIONS,
  MANUAL_NOTIFICATION_MEMBERSHIP_DURATION_CONDITION_LABELS,
  MANUAL_NOTIFICATION_TARGET_LABELS,
} from '../_constants/manual-notification.constants';
import type { ManualNotificationFormValues } from '../_schemas/manual-notification-form.schema';
import { ManualNotificationMemberSelect } from './manual-notification-member-select';

type Target = ManualNotificationFormValues['target'];
type TargetType = Target['type'];
type SelectedStore = Extract<Target, { type: 'stores' }>['stores'][number];

const TARGET_OPTIONS: Array<{ value: TargetType; description: string }> = [
  { value: 'all_members', description: '全ブランド・全店舗の会員' },
  { value: 'brands', description: '選択したブランドの全店舗に配信' },
  { value: 'stores', description: '特定の店舗の会員に配信' },
  { value: 'contract_type', description: '選択した契約種別の会員に配信' },
  { value: 'membership_duration', description: '入会から一定期間の会員に配信' },
  { value: 'dynamic_attribute', description: '未納者・休眠会員 等のシステム属性' },
  { value: 'members', description: '特定の会員を直接選択' },
];

function getTargetPreviewCount(target: Target): number {
  switch (target.type) {
    case 'all_members':
      return 42_580;
    case 'brands':
      return 8_420;
    case 'stores':
      return 1_240;
    case 'contract_type':
      return 5_640;
    case 'membership_duration':
      return 3_180;
    case 'dynamic_attribute':
      return {
        unpaid: 128,
        dormant: 1_840,
        withdrawal_pending: 32,
        birthday_month: 3_420,
        trial: 260,
      }[target.attribute];
    case 'members':
      return target.members.length;
  }
}

function createTarget(type: TargetType): Target {
  switch (type) {
    case 'all_members':
      return { type };
    case 'brands':
      return { type, brands: ['joyfit_all'] };
    case 'stores':
      return { type, stores: [] };
    case 'contract_type':
      return { type, contractTypeId: '', contractTypeName: '' };
    case 'membership_duration':
      return { type, condition: 'within', months: 3 };
    case 'dynamic_attribute':
      return { type, attribute: 'unpaid' };
    case 'members':
      return { type, members: [] };
  }
}

function findTargetType(value: string): TargetType | undefined {
  return TARGET_OPTIONS.find((option) => option.value === value)?.value;
}

function getSelectedStoreSummary(stores: SelectedStore[]): string {
  if (stores.length === 0) return '対象店舗を選択...';
  const names = stores.slice(0, 2).map((store) => store.name);
  return `${names.join('、')}${stores.length > 2 ? ` 他${stores.length - 2}件` : ''}`;
}

function ManualNotificationStoreSelect({
  value,
  onChange,
}: {
  readonly value: SelectedStore[];
  readonly onChange: (value: SelectedStore[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const query = useInfiniteQuery({
    ...getCrmStoresInfiniteOptions({
      query: {
        page: 1,
        limit: 30,
        status: 'operating',
        search: debouncedSearch || undefined,
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
  const stores = query.data?.pages.flatMap((page) => page.stores) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? stores.length;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch('');
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-full max-w-[360px] justify-between font-normal"
          >
            <span className={value.length === 0 ? 'text-muted-foreground' : undefined}>
              {getSelectedStoreSummary(value)}
            </span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-(--anchor-width) gap-0 p-0" align="start">
        <div className="p-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="店舗を検索..."
            className="h-8 text-xs"
          />
        </div>
        <p className="text-muted-foreground border-y px-3 py-2 text-xs">
          {value.length}件選択中 / 全{total}件
        </p>
        <div
          className="max-h-64 overflow-y-auto p-1"
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
            <p className="text-muted-foreground p-3 text-center text-xs">店舗を読み込み中...</p>
          ) : null}
          {query.isError ? (
            <p className="text-destructive p-3 text-center text-xs">店舗の取得に失敗しました</p>
          ) : null}
          {!query.isLoading && !query.isError && stores.length === 0 ? (
            <p className="text-muted-foreground p-3 text-center text-xs">店舗が見つかりません</p>
          ) : null}
          {stores.map((store) => {
            const checked = value.some((selected) => selected.id === store.id);
            return (
              <label
                key={store.id}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) =>
                    onChange(
                      nextChecked
                        ? [...value, { id: store.id, name: store.name }]
                        : value.filter((selected) => selected.id !== store.id),
                    )
                  }
                />
                <span className="truncate">{store.name}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TargetOption({
  value,
  description,
  selected,
  children,
}: {
  readonly value: TargetType;
  readonly description: string;
  readonly selected: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border transition-colors',
        selected && 'border-foreground ring-foreground ring-1',
      )}
    >
      <label className="flex cursor-pointer items-center gap-3 p-4">
        <RadioGroupItem value={value} />
        <span className="text-sm font-medium">{MANUAL_NOTIFICATION_TARGET_LABELS[value]}</span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </label>
      {selected && children ? (
        <div className="bg-muted/50 border-t px-4 pt-3 pb-4">{children}</div>
      ) : null}
    </div>
  );
}

interface ManualNotificationTargetSectionProps {
  readonly approvalRequired: boolean;
}

export function ManualNotificationTargetSection({
  approvalRequired,
}: ManualNotificationTargetSectionProps) {
  const form = useFormContext<ManualNotificationFormValues>();
  const target = useWatch({ control: form.control, name: 'target' });
  const contractsQuery = useQuery({
    ...getCrmMainContractsOptions({ query: { page: 1, limit: 200, status: 'active' } }),
    enabled: target.type === 'contract_type',
  });
  const targetPreviewCount = getTargetPreviewCount(target);

  useEffect(() => {
    if (target.type !== 'contract_type' || target.contractTypeId) return;
    const defaultContract = contractsQuery.data?.main_contracts.find(
      (contract) => contract.name === 'レギュラー会員',
    );
    if (!defaultContract) return;

    form.setValue(
      'target',
      {
        type: 'contract_type',
        contractTypeId: defaultContract.id,
        contractTypeName: defaultContract.name,
      },
      { shouldDirty: true, shouldValidate: true },
    );
  }, [contractsQuery.data?.main_contracts, form, target]);

  const setTarget = (value: Target) =>
    form.setValue('target', value, { shouldDirty: true, shouldValidate: true });

  const renderTargetControl = () => {
    switch (target.type) {
      case 'all_members':
        return null;
      case 'brands':
        return (
          <FormField
            control={form.control}
            name="target.brands"
            render={({ field }) => (
              <FormItem className="max-w-[240px]">
                <Select
                  value={field.value[0] ?? ''}
                  onValueChange={(value) => field.onChange(value ? [value] : [])}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background w-full">
                      <SelectValue placeholder="ブランドを選択">
                        {field.value[0]
                          ? MANUAL_NOTIFICATION_BRAND_LABELS[field.value[0]]
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MANUAL_NOTIFICATION_BRAND_OPTIONS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {MANUAL_NOTIFICATION_BRAND_LABELS[brand]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'stores':
        return (
          <FormField
            control={form.control}
            name="target.stores"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ManualNotificationStoreSelect value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'contract_type':
        return (
          <FormField
            control={form.control}
            name="target.contractTypeId"
            render={({ field }) => (
              <FormItem className="max-w-[240px]">
                <Select
                  value={field.value}
                  disabled={contractsQuery.isLoading || contractsQuery.isError}
                  onValueChange={(value) => {
                    const contract = contractsQuery.data?.main_contracts.find(
                      (item) => item.id === value,
                    );
                    field.onChange(value ?? '');
                    form.setValue('target.contractTypeName', contract?.name ?? '', {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background w-full">
                      <SelectValue
                        placeholder={
                          contractsQuery.isLoading ? '契約種別を読み込み中...' : '契約種別を選択'
                        }
                      >
                        {target.contractTypeName || undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(contractsQuery.data?.main_contracts ?? []).map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contractsQuery.isError ? (
                  <p className="text-destructive text-xs">契約種別の取得に失敗しました</p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'membership_duration':
        return (
          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="target.months"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      className="bg-background w-24"
                      {...field}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="text-muted-foreground text-sm">ヶ月</span>
            <FormField
              control={form.control}
              name="target.condition"
              render={({ field }) => (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-background w-[88px]">
                        <SelectValue>
                          {MANUAL_NOTIFICATION_MEMBERSHIP_DURATION_CONDITION_LABELS[field.value]}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="within">
                        {MANUAL_NOTIFICATION_MEMBERSHIP_DURATION_CONDITION_LABELS.within}
                      </SelectItem>
                      <SelectItem value="at_least">
                        {MANUAL_NOTIFICATION_MEMBERSHIP_DURATION_CONDITION_LABELS.at_least}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        );
      case 'dynamic_attribute':
        return (
          <FormField
            control={form.control}
            name="target.attribute"
            render={({ field }) => (
              <FormItem className="max-w-[320px]">
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-background w-full">
                      <SelectValue>
                        {
                          MANUAL_NOTIFICATION_DYNAMIC_ATTRIBUTE_OPTIONS.find(
                            (option) => option.value === field.value,
                          )?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MANUAL_NOTIFICATION_DYNAMIC_ATTRIBUTE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex flex-col gap-0.5 py-0.5">
                          <span className="text-sm">{option.label}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {option.description}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        );
      case 'members':
        return (
          <FormField
            control={form.control}
            name="target.members"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ManualNotificationMemberSelect value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">配信対象セグメント</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4">
        <FormField
          control={form.control}
          name="target.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                配信対象 <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    const targetType = findTargetType(value);
                    if (targetType) setTarget(createTarget(targetType));
                  }}
                  className="flex flex-col gap-3"
                >
                  {TARGET_OPTIONS.map((option) => (
                    <TargetOption
                      key={option.value}
                      value={option.value}
                      description={option.description}
                      selected={target.type === option.value}
                    >
                      {target.type === option.value ? renderTargetControl() : null}
                    </TargetOption>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted/30 flex w-full max-w-[360px] items-center gap-3 rounded-lg border p-4">
          <Users className="text-muted-foreground size-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="text-muted-foreground text-xs">対象件数（推計）</p>
            <p className="text-lg font-bold">{targetPreviewCount.toLocaleString()}名</p>
          </div>
        </div>

        {approvalRequired ? (
          <Alert className="border-warning/50 bg-warning/15">
            <Bell className="text-warning size-4" />
            <AlertDescription className="text-muted-foreground text-xs">
              <span className="text-warning font-medium">本部承認が必要です。</span>{' '}
              全会員・全ブランド向け通知は本部（HQ）の承認後に配信されます。送信すると、CRMシステム内の通知として本部担当者に承認依頼が届きます。店舗限定通知は承認なしで即時配信できます。
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
