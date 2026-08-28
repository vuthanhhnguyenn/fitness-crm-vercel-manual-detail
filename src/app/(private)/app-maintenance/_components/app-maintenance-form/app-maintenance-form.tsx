'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { DateTimePicker } from '@/components/common/date-time-picker';
import { RequiredMark } from '@/components/common/field-marker';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  getCrmAppMaintenancesByIdQueryKey,
  getCrmAppMaintenancesQueryKey,
  patchCrmAppMaintenancesByIdMutation,
  postCrmAppMaintenancesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { AppMaintenanceStatus, type UpdateAppMaintenanceBody } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { APP_MAINTENANCE_BRAND_LABELS } from '../../_constants/app-maintenance.constants';
import {
  type AppMaintenanceFormMode,
  AppMaintenanceFormSchema,
  type AppMaintenanceFormValues,
} from '../../_schemas/app-maintenance-form.schema';

interface AppMaintenanceFormProps {
  mode: AppMaintenanceFormMode;
  maintenanceId?: string;
  currentStatus?: AppMaintenanceStatus;
  defaultValues?: Partial<AppMaintenanceFormValues>;
}

export function AppMaintenanceForm({
  mode,
  maintenanceId,
  currentStatus,
  defaultValues,
}: AppMaintenanceFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const isStartDateLocked = isEdit && currentStatus === AppMaintenanceStatus.IN_PROGRESS;
  const queryClient = useQueryClient();

  const form = useForm<AppMaintenanceFormValues>({
    resolver: zodResolver(AppMaintenanceFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      targetBrand: '' as unknown as AppMaintenanceFormValues['targetBrand'],
      startsAt: '',
      endsAt: '',
      message: '',
      ...defaultValues,
    },
  });

  const invalidateAndNavigateBack = () => {
    queryClient.invalidateQueries({ queryKey: getCrmAppMaintenancesQueryKey() });
    router.push(navigate('/app-maintenance'));
  };

  const createMutation = useMutation({
    ...postCrmAppMaintenancesMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'メンテナンス設定を登録しました');
      invalidateAndNavigateBack();
    },
    onError: (error) => {
      toast.error((error as { error?: string })?.error || 'メンテナンス設定の登録に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...patchCrmAppMaintenancesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'メンテナンス設定の変更を保存しました');
      if (maintenanceId) {
        queryClient.invalidateQueries({
          queryKey: getCrmAppMaintenancesByIdQueryKey({ path: { id: maintenanceId } }),
        });
      }
      invalidateAndNavigateBack();
    },
    onError: (error) => {
      toast.error((error as { error?: string })?.error || 'メンテナンス設定の保存に失敗しました');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const { isDirty, dirtyFields } = form.formState;

  const handleSubmit = form.handleSubmit((values) => {
    if (isEdit && maintenanceId) {
      const body: UpdateAppMaintenanceBody = {};
      if (dirtyFields.targetBrand) body.targetBrand = values.targetBrand;
      if (dirtyFields.startsAt) body.startsAt = values.startsAt;
      if (dirtyFields.endsAt) body.endsAt = values.endsAt;
      if (dirtyFields.message) body.message = values.message;

      updateMutation.mutate({ path: { id: maintenanceId }, body });
      return;
    }

    createMutation.mutate({
      body: {
        targetBrand: values.targetBrand,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
        message: values.message,
      },
    });
  });

  return (
    <Form {...form}>
      <form noValidate onSubmit={handleSubmit}>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mx-auto flex max-w-[960px] flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">メンテナンス情報</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 px-4">
                <FormField
                  control={form.control}
                  name="targetBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        対象ブランド
                        <RequiredMark />
                      </FormLabel>
                      <p className="text-muted-foreground text-xs">
                        このメンテナンスの影響を受けるモバイルアプリのブランドを選択してください
                      </p>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex items-center gap-6"
                        >
                          {Object.entries(APP_MAINTENANCE_BRAND_LABELS).map(([value, label]) => (
                            <div key={value} className="flex items-center gap-2">
                              <RadioGroupItem value={value} id={`app-maintenance-brand-${value}`} />
                              <Label
                                htmlFor={`app-maintenance-brand-${value}`}
                                className="cursor-pointer text-sm font-normal"
                              >
                                {label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                              onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                              hasError={Boolean(form.formState.errors.startsAt)}
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
                            onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                            hasError={Boolean(form.formState.errors.endsAt)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        メンテナンス中にアプリで会員に表示されるメッセージ
                      </p>
                      <FormControl>
                        <Textarea
                          rows={4}
                          maxLength={TEXTAREA_MAX_LENGTH}
                          placeholder="例: ただいまメンテナンス中です。ご不便をおかけしますがご了承ください。"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="border-warning/50 bg-warning/15">
                  <AlertTriangle className="text-warning size-4" />
                  <AlertDescription className="text-muted-foreground text-xs">
                    メンテナンス期間中、対象ブランドのアプリは利用できなくなります。Y-05
                    強制アップデートは自動で抑制されます。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <Button
                size="lg"
                variant="outline"
                type="button"
                disabled={isPending}
                onClick={() => router.push(navigate('/app-maintenance'))}
              >
                キャンセル
              </Button>
              <Button size="lg" type="submit" disabled={isPending || (isEdit && !isDirty)}>
                {isEdit ? '保存する' : '登録する'}
              </Button>
            </div>
          </div>
        </main>
      </form>
    </Form>
  );
}
