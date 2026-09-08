'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { keepPreviousData, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { Bell, ChevronsUpDown, Users } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce.hook';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll.hook';

import { RequiredMark } from '@/components/common/field-marker';
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
  getCrmNotificationsTargetOptionsStoresInfiniteOptions,
  postCrmNotificationsTargetPreviewMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmNotificationsFormConfigResponse } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import {
  MANUAL_NOTIFICATION_BRAND_LABELS,
  MANUAL_NOTIFICATION_BRAND_OPTIONS,
  MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS,
  MANUAL_NOTIFICATION_CONTRACT_TYPE_OPTIONS,
  MANUAL_NOTIFICATION_DYNAMIC_ATTRIBUTE_OPTIONS,
  MANUAL_NOTIFICATION_MEMBERSHIP_DURATION_CONDITION_LABELS,
  MANUAL_NOTIFICATION_TARGET_LABELS,
  getManualNotificationSelectedBrand,
} from '../_constants/manual-notification.constants';
import {
  type ManualNotificationFormValues,
  manualNotificationTargetToRequest,
} from '../_schemas/manual-notification-form.schema';
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

function getTargetPreviewCount(
  target: Target,
  targetPreviewCounts: GetCrmNotificationsFormConfigResponse['targetPreviewCounts'],
): number {
  switch (target.type) {
    case 'all_members':
      return targetPreviewCounts.allMembers;
    case 'brands': {
      const selectedBrand = getManualNotificationSelectedBrand(target.brands);
      return selectedBrand ? (targetPreviewCounts.brands[selectedBrand] ?? 0) : 0;
    }
    case 'stores':
      // server-side: `targetPreviewCounts.stores` is a per-store map keyed by
      // store id. Sum the entries the user actually selected instead of
      // multiplying a single "average" per store (see the BE util
      // `getManualNotificationFormPreviewCounts` for the live count).
      return target.stores.reduce(
        (sum, store) => sum + (targetPreviewCounts.stores[store.id] ?? 0),
        0,
      );
    case 'contract_type':
      return targetPreviewCounts.contractType[target.contractType] ?? 0;
    case 'membership_duration':
      // The form-config value is a safe fallback while the server-authoritative
      // preview request is in flight. The selected duration is replaced by the
      // response as soon as it arrives.
      return targetPreviewCounts.membershipDuration;
    case 'dynamic_attribute':
      return targetPreviewCounts.dynamicAttributes[target.attribute];
    case 'members':
      return new Set(target.members.map((m) => m.id)).size;
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
      return { type, contractType: 'regular' };
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
    ...getCrmNotificationsTargetOptionsStoresInfiniteOptions({
      query: {
        page: 1,
        limit: 30,
        q: debouncedSearch.trim() || undefined,
      },
    }),
    enabled: open,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: keepPreviousData,
  });
  const stores = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.pagination.totalItems ?? stores.length;
  const storeListRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useInfiniteScroll({
    hasMore: Boolean(query.hasNextPage),
    isLoading: query.isFetchingNextPage,
    onLoadMore: () => {
      void query.fetchNextPage();
    },
    rootRef: storeListRef,
    enabled: open,
  });

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
        <div ref={storeListRef} className="max-h-64 overflow-y-auto p-1">
          {query.isLoading ? (
            <p className="text-muted-foreground p-3 text-center text-xs">店舗を読み込み中...</p>
          ) : null}
          {query.isError ? (
            <div className="flex flex-col items-center gap-2 p-3">
              <p className="text-destructive text-center text-xs">店舗の取得に失敗しました</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void query.refetch()}
              >
                再試行
              </Button>
            </div>
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
          {(query.hasNextPage || query.isFetchingNextPage) && (
            <div ref={sentinelRef} className="text-muted-foreground py-1 text-center text-xs">
              {query.isFetchingNextPage ? '読み込み中...' : null}
            </div>
          )}
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
  readonly formConfig: GetCrmNotificationsFormConfigResponse;
}

export function ManualNotificationTargetSection({
  approvalRequired,
  formConfig,
}: ManualNotificationTargetSectionProps) {
  const form = useFormContext<ManualNotificationFormValues>();
  const target = useWatch({ control: form.control, name: 'target' });
  const { mutate: previewTargetCount } = useMutation(postCrmNotificationsTargetPreviewMutation());
  const previewTarget = useMemo(() => manualNotificationTargetToRequest(target), [target]);
  const previewTargetKey = JSON.stringify(previewTarget);
  const [serverPreview, setServerPreview] = useState<{
    key: string;
    count: number;
  } | null>(null);
  const previewRequestId = useRef(0);
  const isPreviewTargetReady =
    target.type !== 'membership_duration' ||
    (Number.isInteger(target.months) && target.months >= 1 && target.months <= 60);

  useEffect(() => {
    if (!isPreviewTargetReady) return;

    const requestId = ++previewRequestId.current;
    const timeoutId = window.setTimeout(
      () => {
        previewTargetCount(
          { body: previewTarget },
          {
            onSuccess: (response) => {
              if (requestId === previewRequestId.current) {
                setServerPreview({ key: previewTargetKey, count: response.targetCount });
              }
            },
            onError: () => {
              if (requestId === previewRequestId.current) setServerPreview(null);
            },
          },
        );
      },
      target.type === 'membership_duration' ? 250 : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [isPreviewTargetReady, previewTarget, previewTargetCount, previewTargetKey, target.type]);

  const targetPreviewCount =
    serverPreview?.key === previewTargetKey
      ? serverPreview.count
      : getTargetPreviewCount(target, formConfig.targetPreviewCounts);

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
            name="target.contractType"
            render={({ field }) => (
              <FormItem className="max-w-[240px]">
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-background w-full">
                      <SelectValue placeholder="契約種別を選択">
                        {MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS[field.value]}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MANUAL_NOTIFICATION_CONTRACT_TYPE_OPTIONS.map((contractType) => (
                      <SelectItem key={contractType} value={contractType}>
                        {MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS[contractType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === '' ? undefined : event.target.valueAsNumber,
                        )
                      }
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
                配信対象 <RequiredMark />
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
              全会員向けまたはブランド全体（JOYFIT全体・FIT365）向けの通知は本部（HQ）の承認後に配信されます。送信すると、CRMシステム内の通知として本部担当者に承認依頼が届きます。
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
