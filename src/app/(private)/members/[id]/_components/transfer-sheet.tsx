'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Store } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { SearchableSelect } from '@/components/common/searchable-select';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  getCrmStoresInfiniteOptions,
  getCrmTransfersQueryKey,
  postCrmMembersByIdTransferMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import {
  type GetCrmStoresResponse,
  MainBrand,
  type ProxyAgreementMethod,
} from '@/lib/api/types.gen';

import { ProxyApplicationSection } from './proxy-application-section';

type StoreRow = GetCrmStoresResponse['stores'][number];

// ── Zod schema ────────────────────────────────────────────────────────────────
const transferFormSchema = z
  .object({
    to_store_id: z.string().min(1, '移籍先店舗は必須です'),
    to_store_name: z.string().min(1),
    reason: z.string().optional(),
    is_proxy: z.boolean(),
    proxy_agreed_at: z.string().optional(),
    proxy_method: z.string().optional(),
  })
  .refine((data) => !data.is_proxy || !!data.proxy_agreed_at, {
    message: '合意日時は必須です',
    path: ['proxy_agreed_at'],
  });

type TransferFormValues = z.infer<typeof transferFormSchema>;

const DEFAULT_VALUES: TransferFormValues = {
  to_store_id: '',
  to_store_name: '',
  reason: '',
  is_proxy: false,
  proxy_agreed_at: undefined,
  proxy_method: '',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface TransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  currentStoreId: string;
  currentStoreName: string;
  hasUnpaidFee: boolean;
  inCancellationPeriod: boolean;
}

// ── TransferSheet ─────────────────────────────────────────────────────────────
export function TransferSheet({
  open,
  onOpenChange,
  memberId,
  currentStoreId,
  currentStoreName,
  hasUnpaidFee,
  inCancellationPeriod,
}: Readonly<TransferSheetProps>) {
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    mode: 'onSubmit',
    defaultValues: DEFAULT_VALUES,
  });

  // RHF is the single source of truth; useWatch drives the conditional UI
  const toStoreId = useWatch({ control: form.control, name: 'to_store_id' });
  const toStoreName = useWatch({ control: form.control, name: 'to_store_name' });
  const isProxy = useWatch({ control: form.control, name: 'is_proxy' });
  const proxyAgreedAt = useWatch({ control: form.control, name: 'proxy_agreed_at' });
  const proxyMethod = useWatch({ control: form.control, name: 'proxy_method' });

  // The selected store's brand drives the workflow hint; kept aside from the submitted values
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);

  // FR-014: 申請 operations must be confirmed before they are sent
  const [showConfirm, setShowConfirm] = useState(false);

  // Destination-store list: server-side search + infinite scroll (no fixed limit
  // that could drop stores), excluding the member's current store.
  const [storeOpen, setStoreOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const {
    data: storesData,
    isFetching: isStoresFetching,
    fetchNextPage: fetchNextStores,
    hasNextPage: hasMoreStores,
    isFetchingNextPage: isFetchingMoreStores,
  } = useInfiniteQuery({
    ...getCrmStoresInfiniteOptions({
      query: { limit: 20, search: storeSearch || undefined, sort_by: 'name', sort_order: 'asc' },
    }),
    enabled: storeOpen,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmStoresResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const storeOptions = useMemo(
    () =>
      (storesData?.pages.flatMap((page) => page.stores ?? []) ?? []).filter(
        (store) => store.id !== currentStoreId,
      ),
    [storesData, currentStoreId],
  );

  const mutation = useMutation({
    ...postCrmMembersByIdTransferMutation(),
    onSuccess: () => {
      toast.success('移籍申請を受け付けました', {
        description: '移籍先店舗に通知を送りました',
      });
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('移籍申請に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset(DEFAULT_VALUES);
      setSelectedStore(null);
    }, 300);
  };

  // Validate first, then ask for confirmation; the mutation only runs from the dialog.
  const handleSubmit = form.handleSubmit(() => {
    setShowConfirm(true);
  }, scrollToFirstError);

  const handleConfirm = () => {
    setShowConfirm(false);
    const data = form.getValues();
    mutation.mutate({
      path: { id: memberId },
      body: {
        to_store_id: data.to_store_id,
        to_store_name: data.to_store_name,
        reason: data.reason || undefined,
        is_proxy: data.is_proxy,
        proxy_agreed_at: data.is_proxy ? data.proxy_agreed_at : undefined,
        proxy_method:
          data.is_proxy && data.proxy_method
            ? (data.proxy_method as ProxyAgreementMethod)
            : undefined,
      },
    });
  };

  const handleProxyAgreedAtChange = (date: Date | undefined) => {
    form.setValue('proxy_agreed_at', date ? date.toISOString() : undefined);
    if (date) form.clearErrors('proxy_agreed_at');
  };

  const handleStoreChange = (store: StoreRow | null) => {
    setSelectedStore(store);
    form.setValue('to_store_id', store?.id ?? '', { shouldValidate: form.formState.isSubmitted });
    form.setValue('to_store_name', store?.name ?? '');
  };

  const isDisabled = hasUnpaidFee || inCancellationPeriod;

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
          {/* Header */}
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <ArrowRightLeft className="size-4" />
                移籍申請
              </SheetTitle>
              <SheetDescription className="sr-only">移籍申請フォーム</SheetDescription>
            </SheetHeader>
          </div>

          {/* Body */}
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6">
                {/* Cancellation period warning */}
                {inCancellationPeriod && (
                  <div className="pt-4">
                    <Alert className="border-destructive/30 bg-destructive/10">
                      <AlertDescription className="text-destructive text-xs">
                        解約手数料期間中のため移籍できません。管理者にお問い合わせください。
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Unpaid fee warning */}
                {!inCancellationPeriod && hasUnpaidFee && (
                  <div className="pt-4">
                    <Alert className="border-destructive/30 bg-destructive/10">
                      <AlertDescription className="text-destructive text-xs">
                        未納金があるため操作できません。未納金を解消してから移籍申請を行ってください。
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Proxy section */}
                <div className="py-4">
                  <ProxyApplicationSection
                    isProxy={isProxy}
                    onIsProxyChange={(v) => form.setValue('is_proxy', v)}
                    agreedAt={proxyAgreedAt ? new Date(proxyAgreedAt) : undefined}
                    onAgreedAtChange={handleProxyAgreedAtChange}
                    method={(proxyMethod ?? '') as ProxyAgreementMethod | ''}
                    onMethodChange={(v) => form.setValue('proxy_method', v)}
                    agreedAtError={form.formState.errors.proxy_agreed_at?.message}
                  />
                </div>

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                {/* Store selection */}
                <div className="flex flex-col gap-4 py-4">
                  {/* Current store */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">現在の主契約店舗</Label>
                    <div className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2">
                      <Store className="text-muted-foreground size-4" />
                      <span className="text-sm font-medium">{currentStoreName}</span>
                    </div>
                  </div>

                  {/* Target store */}
                  <FormField
                    control={form.control}
                    name="to_store_id"
                    render={({ fieldState }) => (
                      <FormItem>
                        <FormLabel htmlFor="transfer-store" className="text-sm font-medium">
                          移籍先店舗 <span className="text-destructive ml-1 text-xs">*</span>
                        </FormLabel>
                        <FormControl>
                          <SearchableSelect<StoreRow>
                            value={toStoreId || null}
                            valueLabel={toStoreName || undefined}
                            options={storeOptions}
                            placeholder="選択してください"
                            searchPlaceholder="店舗名・店舗IDで検索..."
                            emptyMessage="該当する店舗がありません"
                            loadingMessage="店舗を読み込み中..."
                            disabled={isDisabled}
                            open={storeOpen}
                            onOpenChange={setStoreOpen}
                            onSearchChange={setStoreSearch}
                            onSelect={handleStoreChange}
                            getOptionKey={(store) => store.id}
                            getOptionLabel={(store) => store.name}
                            getOptionKeywords={(store) =>
                              [store.name, store.store_id, store.id, store.club_code]
                                .filter(Boolean)
                                .join(' ')
                            }
                            renderOption={(store) => (
                              <TextWithTooltip
                                text={store.name}
                                wrapperClassName="w-full"
                                className="w-full"
                                side="right"
                                align="center"
                              />
                            )}
                            isLoading={isStoresFetching}
                            hasMore={hasMoreStores}
                            isLoadingMore={isFetchingMoreStores}
                            onLoadMore={fetchNextStores}
                            loadingMoreMessage="読み込み中..."
                            hasError={!!fieldState.error}
                            triggerClassName="h-9 w-full text-sm font-normal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedStore && (
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-muted-foreground mb-1 text-xs">移籍ワークフロー</p>
                      <p className="text-sm font-medium">
                        {selectedStore.brand === MainBrand.JOYFIT
                          ? '① 申請 → ② 移籍元承認 → ③ 自動移籍'
                          : '① 申請 → ② 移籍元承認 → ③ 移籍先承認 → ④ 移籍実行'}
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 py-4">
                      <FormLabel htmlFor="transfer-reason" className="text-sm font-medium">
                        移籍理由 <span className="text-muted-foreground ml-1 text-xs">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          maxLength={TEXTAREA_MAX_LENGTH}
                          id="transfer-reason"
                          rows={3}
                          className="resize-none text-sm"
                          disabled={isDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Footer */}
              <div className="flex shrink-0 gap-2 border-t px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={mutation.isPending}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isDisabled || mutation.isPending}
                >
                  移籍申請を送信
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirm AlertDialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移籍申請を送信しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {currentStoreName} から {toStoreName}{' '}
              への移籍を申請します。移籍先店舗に通知が送られます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowConfirm(false);
              }}
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>送信する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
