'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useAuthUser } from '@/contexts/auth-user.context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Sparkles } from 'lucide-react';

import { OptionalMark } from '@/components/common/field-marker';
import { SearchableSelect } from '@/components/common/searchable-select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getCrmStoresByIdOptions,
  getCrmStoresInfiniteOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  CampaignDetailResponse,
  GetCrmStoresResponse,
  PromoCodeScope,
} from '@/lib/api/types.gen';

import { UserRole } from '@/types/permission.type';

import { CAMPAIGN_SEARCH_PAGE_LIMIT, PROMO_CODE_SCOPE_OPTIONS } from '../../_constants/constants';
import type { PromoCodesTabHook } from '../_hooks/use-promo-codes-tab';
import {
  PROMO_CODE_ISSUANCE_DEFAULTS,
  type PromoCodeIssuanceValues,
  promoCodeIssuanceSchema,
} from '../_schemas/promo-code-issuance.schema';

const DATE_FORMAT = 'yyyy-MM-dd';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function toDate(value: string): Date | undefined {
  return value ? parse(value, DATE_FORMAT, new Date(), { locale: ja }) : undefined;
}

/** G-06 FR-002 / G-03 FR-007: 命名規則「店舗ID＋英数字5桁」。OGF向けは「OGF＋英数字5桁」。 */
function generateCode(scopeType: PromoCodeScope | '', storeCode: string): string {
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `${scopeType === 'ogf_only' ? 'OGF' : storeCode}-${suffix}`;
}

type PromoCodeCreateDialogProps = {
  campaign: CampaignDetailResponse;
  tab: PromoCodesTabHook;
};

export function PromoCodeCreateDialog({ campaign, tab }: Readonly<PromoCodeCreateDialogProps>) {
  const [storeSearch, setStoreSearch] = useState('');
  const {
    data: storesData,
    isFetching: isStoresFetching,
    fetchNextPage: fetchNextStores,
    hasNextPage: hasMoreStores,
    isFetchingNextPage: isFetchingMoreStores,
  } = useInfiniteQuery({
    ...getCrmStoresInfiniteOptions({
      query: { limit: CAMPAIGN_SEARCH_PAGE_LIMIT, search: storeSearch || undefined },
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmStoresResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const stores = useMemo(
    () => storesData?.pages.flatMap((page) => page.stores ?? []) ?? [],
    [storesData],
  );

  const form = useForm<PromoCodeIssuanceValues>({
    resolver: zodResolver(promoCodeIssuanceSchema) as never,
    mode: 'onChange',
    defaultValues: { ...PROMO_CODE_ISSUANCE_DEFAULTS, campaignId: campaign.id },
  });

  const scopeType = useWatch({ control: form.control, name: 'scopeType' });
  const issuedStoreId = useWatch({ control: form.control, name: 'issuedStoreId' });

  const selectedStoreFromSearch = stores.find((store) => store.id === issuedStoreId);
  const { data: selectedStoreRes } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id: issuedStoreId } }),
    enabled: !!issuedStoreId && !selectedStoreFromSearch,
  });
  const selectedStore = selectedStoreFromSearch ?? selectedStoreRes?.store;

  const { user } = useAuthUser();
  const isScopeLockedToStore = user?.role === UserRole.Staff;
  const scopeOptions = isScopeLockedToStore
    ? PROMO_CODE_SCOPE_OPTIONS.filter((option) => option.value === 'issuer_store_only')
    : PROMO_CODE_SCOPE_OPTIONS;

  useEffect(() => {
    if (!tab.issueDialogOpen) {
      form.reset({
        ...PROMO_CODE_ISSUANCE_DEFAULTS,
        campaignId: campaign.id,
        ...(isScopeLockedToStore ? { scopeType: 'issuer_store_only' as const } : {}),
      });
    }
  }, [tab.issueDialogOpen, campaign.id, form, isScopeLockedToStore]);

  const handleAutoGenerate = () => {
    const storeCode = selectedStore?.club_code ?? 'STR01';
    form.setValue('code', generateCode(scopeType, storeCode), { shouldValidate: true });
    form.setValue('generationMethod', 'manual');
  };

  return (
    <AlertDialog open={tab.issueDialogOpen} onOpenChange={tab.setIssueDialogOpen}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>プロモーションコードを発行</AlertDialogTitle>
          <AlertDialogDescription>
            命名規則: 店舗ID＋英数字5桁 / OGF会員向け:
            OGF＋英数字5桁。登録時にユニーク性を自動判定します。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="promo-code-issue-form"
            className="flex flex-col gap-3 py-2"
            onSubmit={form.handleSubmit(tab.issueCode)}
          >
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">紐づけキャンペーン</Label>
              <Input value={campaign.name} readOnly className="bg-muted" />
            </div>

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-muted-foreground text-xs">コード</Label>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        placeholder="例: STR01-ABCDE（手動入力 or 自動生成）"
                        className="flex-1 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1"
                      onClick={handleAutoGenerate}
                    >
                      <Sparkles className="size-4" />
                      自動生成
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-[10px]">
                    手動入力時は保存前に全コードと重複チェックを行います
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-muted-foreground text-xs">
                    説明
                    <OptionalMark />
                  </Label>
                  <FormControl>
                    <Input placeholder="例: 春の入会キャンペーン用" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">有効期間</Label>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <DatePicker
                          date={toDate(field.value)}
                          onDateChange={(date) =>
                            field.onChange(date ? format(date, DATE_FORMAT) : '')
                          }
                          placeholder="開始日"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <span className="text-muted-foreground text-xs">〜</span>
                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <DatePicker
                          date={toDate(field.value)}
                          onDateChange={(date) =>
                            field.onChange(date ? format(date, DATE_FORMAT) : '')
                          }
                          placeholder="終了日"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="maxUses"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-muted-foreground text-xs">使用上限</Label>
                  <FormControl>
                    <Input placeholder="例: 100（空欄で無制限）" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scopeType"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-muted-foreground text-xs">適用店舗タイプ</Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isScopeLockedToStore}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {/* base-ui の Select.Value は既定で「値」を描画するためラベルを明示する。 */}
                        <SelectValue placeholder="選択してください">
                          {PROMO_CODE_SCOPE_OPTIONS.find((option) => option.value === field.value)
                            ?.label ?? undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {scopeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isScopeLockedToStore && (
                    <p className="text-muted-foreground text-[10px]">
                      店舗スタッフが発行するコードは「発行店舗のみ」に固定されます
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {scopeType === 'issuer_store_only' && (
              <FormField
                control={form.control}
                name="issuedStoreId"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-muted-foreground text-xs">発行店舗</Label>
                    <FormControl>
                      <SearchableSelect
                        value={field.value || null}
                        valueLabel={selectedStore?.name}
                        options={stores}
                        placeholder="店舗を選択"
                        searchPlaceholder="店舗名・クラブコードで検索..."
                        emptyMessage="該当する店舗がありません"
                        loadingMessage="検索中..."
                        isLoading={isStoresFetching && !isFetchingMoreStores}
                        hasMore={hasMoreStores}
                        isLoadingMore={isFetchingMoreStores}
                        onLoadMore={fetchNextStores}
                        loadingMoreMessage="読み込み中..."
                        onSearchChange={setStoreSearch}
                        onSelect={(store) => field.onChange(store?.id ?? '')}
                        getOptionKey={(store) => store.id}
                        getOptionLabel={(store) => store.name}
                        triggerClassName="h-9 w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={tab.isIssuing}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            type="submit"
            form="promo-code-issue-form"
            disabled={tab.isIssuing}
            onClick={(event) => {
              event.preventDefault();
              void form.handleSubmit(tab.issueCode)();
            }}
          >
            発行する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
