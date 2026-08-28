'use client';

// Client component: react-hook-form state, DateTimePicker, dialogs, and mutations.
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { formatDatetimeISO } from '@/utils/format.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { type MutationFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

import { DateTimePicker } from '@/components/common/date-time-picker';
import { OptionalMark, RequiredMark } from '@/components/common/field-marker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  getCrmMaintenancesByIdQueryKey,
  getCrmMaintenancesQueryKey,
  patchCrmMaintenancesByIdMutation,
  postCrmMaintenancesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import {
  type CrmMaintenanceStatus,
  CrmMaintenanceStatus as CrmMaintenanceStatusEnum,
  type UpdateCrmMaintenanceBody,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  type CrmMaintenanceFormMode,
  CrmMaintenanceFormSchema,
  type CrmMaintenanceFormValues,
} from '../../_schemas/crm-maintenance-form.schema';
import { CrmMaintenanceAllowedUserList } from './crm-maintenance-allowed-user-list';
import { CrmMaintenanceConfirmDialog } from './crm-maintenance-confirm-dialog';

const OVERLAP_MESSAGE = '登録しようとしている期間は既存のメンテナンス期間と重複しています。';

function isPeriodConflictError(error: unknown): boolean {
  return (error as { error?: string })?.error === OVERLAP_MESSAGE;
}

interface CrmMaintenanceFormProps {
  mode: CrmMaintenanceFormMode;
  maintenanceId?: string;
  currentStatus?: CrmMaintenanceStatus;
  defaultValues?: Partial<CrmMaintenanceFormValues>;
}

export function CrmMaintenanceForm({
  mode,
  maintenanceId,
  currentStatus,
  defaultValues,
}: CrmMaintenanceFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const isStartDateLocked = isEdit && currentStatus === CrmMaintenanceStatusEnum.IN_PROGRESS;
  const queryClient = useQueryClient();

  const [showConfirm, setShowConfirm] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [periodErrorField, setPeriodErrorField] = useState<'startsAt' | 'endsAt'>('endsAt');
  const [confirmSummary, setConfirmSummary] = useState<{
    title: string;
    period: string;
    allowedUserCount: number;
  }>({ title: '', period: '', allowedUserCount: 0 });

  const [defaultStartsAt] = useState(() => new Date().toISOString());
  const [defaultEndsAt] = useState(() => new Date(Date.now() + 30 * 60 * 1000).toISOString());

  const form = useForm<CrmMaintenanceFormValues>({
    resolver: zodResolver(CrmMaintenanceFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      title: '',
      startsAt: defaultStartsAt,
      endsAt: defaultEndsAt,
      message: '',
      note: '',
      allowedUsers: [],
      ...defaultValues,
    },
  });

  const goBackToList = () => {
    queryClient.invalidateQueries({ queryKey: getCrmMaintenancesQueryKey() });
    router.push(navigate('/crm-maintenance'));
  };

  const handleMutationError = (error: unknown) => {
    setShowConfirm(false);
    toast.error((error as { error?: string })?.error || 'CRMメンテナンスの保存に失敗しました');
  };

  const handlePeriodConflict = () => {
    setShowConfirm(false);
    setPeriodError(OVERLAP_MESSAGE);
  };

  // Wraps a generated mutation so a period-conflict rejection resolves to `null` instead of
  // throwing - the app-wide error toast (react-query.provider.tsx) fires on any mutation
  // rejection, so this is what keeps this already-handled case from also popping a redundant
  // toast on top of the inline message above.
  function withPeriodConflictHandling<TData, TVariables>(
    { mutationFn }: { mutationFn?: MutationFunction<TData, TVariables> },
    onSuccess: (data: TData) => void,
  ) {
    const mutationFnOrNull: MutationFunction<TData | null, TVariables> = async (
      variables,
      context,
    ) => {
      try {
        return await mutationFn!(variables, context);
      } catch (error) {
        if (isPeriodConflictError(error)) return null;
        throw error;
      }
    };

    return {
      mutationFn: mutationFnOrNull,
      onSuccess: (response: TData | null) =>
        response ? onSuccess(response) : handlePeriodConflict(),
      onError: handleMutationError,
    };
  }

  const createMutation = useMutation(
    withPeriodConflictHandling(postCrmMaintenancesMutation(), (response) => {
      toast.success(response.message || 'CRMメンテナンスを登録しました');
      goBackToList();
    }),
  );

  const updateMutation = useMutation(
    withPeriodConflictHandling(patchCrmMaintenancesByIdMutation(), (response) => {
      toast.success(response.message || 'CRMメンテナンスの変更を保存しました');
      if (maintenanceId) {
        queryClient.invalidateQueries({
          queryKey: getCrmMaintenancesByIdQueryKey({ path: { id: maintenanceId } }),
        });
      }
      goBackToList();
    }),
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleValidSubmit = (submitted: CrmMaintenanceFormValues) => {
    setPeriodError(null);
    setConfirmSummary({
      title: submitted.title,
      period:
        submitted.startsAt && submitted.endsAt
          ? `${formatDatetimeISO(submitted.startsAt)} 〜 ${formatDatetimeISO(submitted.endsAt)}`
          : '',
      allowedUserCount: submitted.allowedUsers.length,
    });
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const current = form.getValues();
    const allowedUserIds = current.allowedUsers.map((user) => user.staffId);

    if (isEdit && maintenanceId) {
      const body: UpdateCrmMaintenanceBody = {
        title: current.title,
        endsAt: current.endsAt,
        message: current.message,
        note: current.note?.trim() ? current.note : null,
        allowedUserIds,
      };
      // Start datetime is immutable while in progress — omit it from the patch.
      if (!isStartDateLocked) {
        body.startsAt = current.startsAt;
      }
      updateMutation.mutate({ path: { id: maintenanceId }, body });
      return;
    }

    createMutation.mutate({
      body: {
        title: current.title,
        startsAt: current.startsAt,
        endsAt: current.endsAt,
        message: current.message,
        note: current.note?.trim() ? current.note : undefined,
        allowedUserIds,
      },
    });
  };

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleValidSubmit)}>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto flex max-w-[960px] flex-col gap-6">
            {/* Card 1: 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">基本情報</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 px-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        タイトル
                        <RequiredMark />
                      </FormLabel>
                      <p className="text-muted-foreground text-xs">
                        管理用の識別名（例: 2026年4月定期メンテナンス）
                      </p>
                      <FormControl>
                        <Input
                          placeholder="例: 2026年4月定期メンテナンス"
                          maxLength={TEXT_MAX_LENGTH}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 items-start gap-4">
                    <FormField
                      control={form.control}
                      name="startsAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            開始日時
                            <RequiredMark />
                          </FormLabel>
                          <FormControl>
                            {isStartDateLocked ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger render={<span className="inline-flex w-full" />}>
                                    <div className="relative w-full">
                                      <DateTimePicker
                                        value={field.value ? new Date(field.value) : undefined}
                                        onChange={() => {}}
                                        disabled
                                        hasError={Boolean(form.formState.errors.startsAt)}
                                      />
                                      <Lock className="text-muted-foreground absolute top-1/2 right-8 size-3 -translate-y-1/2" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">
                                      メンテナンス中のため開始日時は変更できません
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <DateTimePicker
                                value={field.value ? new Date(field.value) : undefined}
                                onChange={(date) => {
                                  setPeriodError(null);
                                  setPeriodErrorField('startsAt');
                                  field.onChange(date ? date.toISOString() : '');
                                }}
                                hasError={
                                  Boolean(form.formState.errors.startsAt) ||
                                  (Boolean(periodError) && periodErrorField === 'startsAt')
                                }
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endsAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            終了日時
                            <RequiredMark />
                          </FormLabel>
                          <FormControl>
                            <DateTimePicker
                              value={field.value ? new Date(field.value) : undefined}
                              onChange={(date) => {
                                setPeriodError(null);
                                setPeriodErrorField('endsAt');
                                field.onChange(date ? date.toISOString() : '');
                              }}
                              hasError={
                                Boolean(form.formState.errors.endsAt) ||
                                (Boolean(periodError) && periodErrorField === 'endsAt')
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {periodError && <p className="text-destructive text-xs">{periodError}</p>}
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        メンテナンスメッセージ
                        <RequiredMark />
                      </FormLabel>
                      <p className="text-muted-foreground text-xs">
                        アクセス制限時にユーザーに表示するメッセージ
                      </p>
                      <FormControl>
                        <Textarea
                          rows={4}
                          maxLength={TEXTAREA_MAX_LENGTH}
                          placeholder="例: ただいまCRMシステムのメンテナンス中です。ご不便をおかけしますがご了承ください。"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        備考
                        <OptionalMark />
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          maxLength={TEXTAREA_MAX_LENGTH}
                          placeholder="補足事項があれば入力してください"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Card 2: 許可ユーザー */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">許可ユーザー</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <FormField
                  control={form.control}
                  name="allowedUsers"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CrmMaintenanceAllowedUserList
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t p-4">
              <Button
                size="lg"
                variant="outline"
                type="button"
                disabled={isPending}
                onClick={() => router.push(navigate('/crm-maintenance'))}
              >
                キャンセル
              </Button>
              <Button size="lg" type="submit" disabled={isPending}>
                {isEdit ? '保存する' : '登録する'}
              </Button>
            </div>
          </div>
        </main>
      </form>

      <CrmMaintenanceConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        mode={mode}
        summary={confirmSummary}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </Form>
  );
}
