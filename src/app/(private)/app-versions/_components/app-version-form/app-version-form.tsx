'use client';

import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { FormField } from '@/components/common/form-field';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmAppVersionsByIdQueryKey,
  getCrmAppVersionsQueryKey,
  patchCrmAppVersionsByIdMutation,
  postCrmAppVersionsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { AppVersionBrandEnum } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { APP_VERSION_BRAND_LABELS } from '../../_constants/app-version.constants';
import {
  appVersionFormValuesToCreateBody,
  appVersionFormValuesToUpdateBody,
} from '../../_schemas/app-version-form.mapper';
import {
  AppVersionFormSchema,
  type AppVersionFormSubmitValues,
  type AppVersionFormValues,
  emptyAppVersionFormValues,
} from '../../_schemas/app-version-form.schema';

interface AppVersionFormProps {
  mode: 'create' | 'edit';
  defaultValues?: AppVersionFormValues;
  versionId?: string;
}

export function AppVersionForm({ mode, defaultValues, versionId }: AppVersionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<AppVersionFormValues, unknown, AppVersionFormSubmitValues>({
    resolver: zodResolver(AppVersionFormSchema) as never,
    mode: 'onChange',
    defaultValues: defaultValues ?? emptyAppVersionFormValues,
  });

  const formErrors = form.formState.errors;

  const navigateToList = useCallback(() => {
    router.push(navigate('/app-versions'));
  }, [router]);

  const invalidateAndNavigate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getCrmAppVersionsQueryKey() });
    navigateToList();
  }, [queryClient, navigateToList]);

  const createMutation = useMutation({
    ...postCrmAppVersionsMutation(),
    onSuccess: () => {
      toast.success('アプリバージョンを登録しました');
      invalidateAndNavigate();
    },
    onError: () => {
      toast.error('アプリバージョンの作成に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...patchCrmAppVersionsByIdMutation(),
    onSuccess: () => {
      toast.success('アプリバージョンの変更を保存しました');
      if (versionId) {
        queryClient.invalidateQueries({
          queryKey: getCrmAppVersionsByIdQueryKey({ path: { id: versionId } }),
        });
      }
      invalidateAndNavigate();
    },
    onError: () => {
      toast.error('アプリバージョンの更新に失敗しました');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = form.handleSubmit(
    (values) => {
      if (mode === 'create') {
        createMutation.mutate({ body: appVersionFormValuesToCreateBody(values) });
        return;
      }

      if (versionId) {
        updateMutation.mutate({
          body: appVersionFormValuesToUpdateBody(values),
          path: { id: versionId },
        });
      }
    },
    () => {
      setTimeout(() => {
        const element = document.querySelector("[aria-invalid='true']");
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    },
  );

  return (
    <div className="bg-background flex-1 overflow-y-auto px-6 py-4">
      <div className="mx-auto flex max-w-240 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">バージョン情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex flex-col gap-6">
              <FormField label="ブランド" required error={formErrors.brandEnum?.message}>
                <Controller
                  control={form.control}
                  name="brandEnum"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      className="flex flex-wrap items-center gap-6"
                    >
                      {Object.values(AppVersionBrandEnum).map((brand) => (
                        <div key={brand} className="flex items-center gap-2">
                          <RadioGroupItem
                            value={brand}
                            id={`brand-${brand}`}
                            className={
                              formErrors.brandEnum
                                ? 'border-destructive text-destructive'
                                : undefined
                            }
                          />
                          <Label
                            htmlFor={`brand-${brand}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {APP_VERSION_BRAND_LABELS[brand]}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="iOSバージョン"
                  required
                  description="X.Y.Z 形式（例: 1.2.3）"
                  error={formErrors.iosVersionName?.message ?? formErrors.iosBuildNumber?.message}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="X.Y.Z"
                      className="flex-1"
                      pattern="^\d+\.\d+\.\d+$"
                      title="X.Y.Z 形式（半角数字とドット）"
                      maxLength={TEXT_MAX_LENGTH}
                      aria-invalid={!!formErrors.iosVersionName}
                      {...form.register('iosVersionName')}
                    />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">ビルド</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="番号"
                      className="w-25"
                      aria-invalid={!!formErrors.iosBuildNumber}
                      {...form.register('iosBuildNumber')}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Androidバージョン"
                  required
                  description="X.Y.Z 形式（例: 1.2.3）"
                  error={
                    formErrors.androidVersionName?.message ?? formErrors.androidBuildNumber?.message
                  }
                >
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="X.Y.Z"
                      className="flex-1"
                      pattern="^\d+\.\d+\.\d+$"
                      title="X.Y.Z 形式（半角数字とドット）"
                      maxLength={TEXT_MAX_LENGTH}
                      aria-invalid={!!formErrors.androidVersionName}
                      {...form.register('androidVersionName')}
                    />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">ビルド</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="番号"
                      className="w-25"
                      aria-invalid={!!formErrors.androidBuildNumber}
                      {...form.register('androidBuildNumber')}
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="リリース日" required error={formErrors.releaseDate?.message}>
                <Controller
                  control={form.control}
                  name="releaseDate"
                  render={({ field }) => (
                    <DatePicker
                      date={field.value ? parseISO(field.value) : undefined}
                      onDateChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      placeholder="日付を選択"
                      hasError={!!formErrors.releaseDate}
                    />
                  )}
                />
              </FormField>

              <FormField label="備考" error={formErrors.remarks?.message}>
                <Textarea
                  placeholder="バージョンに関する備考を入力"
                  rows={4}
                  maxLength={TEXTAREA_MAX_LENGTH}
                  {...form.register('remarks')}
                />
              </FormField>

              <Alert className="border-warning/50 bg-warning/15">
                <AlertTriangle className="text-warning size-4" />
                <AlertDescription className="text-muted-foreground text-xs">
                  メンテナンス中に強制アップデートのポップアップを表示させないように日時設定をしてください
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={navigateToList}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <RoleGatedButton
            allowedRoles={[UserRole.Headquarter, UserRole.System]}
            denyTooltip="アプリバージョンの登録・編集は本部のみ可能です"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {mode === 'create' ? '登録する' : '保存する'}
          </RoleGatedButton>
        </div>
      </div>
    </div>
  );
}
