'use client';

// Client component: react-hook-form state, mutations, and the discard dialog
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
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
import { Form } from '@/components/ui/form';

import {
  getCrmPermissionsOptions,
  getCrmPositionsByIdPermissionsQueryKey,
  getCrmPositionsByIdQueryKey,
  getCrmPositionsQueryKey,
  patchCrmPositionsByIdMutation,
  postCrmPositionsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { PositionDetail } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  type PositionFormValues,
  createEmptyPositionFormValues,
  mapFormValuesToCreateBody,
  mapFormValuesToUpdateBody,
  mapPositionDetailToFormValues,
  positionFormSchema,
} from '../../_schemas/position-form.schema';
import { PositionFormBasicInfoSection } from './position-form-basic-info-section';
import { PositionFormPermissionsSection } from './position-form-permissions-section';

export type PositionFormMode = 'create' | 'edit' | 'clone';

const PAGE_TITLES: Record<PositionFormMode, string> = {
  create: '職位 新規作成',
  edit: '職位 編集',
  clone: '職位 複製して作成',
};

const DUPLICATE_NAME_MESSAGE = '同じロール内に同名の職位が既に存在します';

type PositionFormProps = {
  mode: PositionFormMode;
  /** edit / clone prefill source (FR-012 / FR-013) */
  defaultDetail?: PositionDetail;
};

export function PositionForm({ mode, defaultDetail }: Readonly<PositionFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const [discardOpen, setDiscardOpen] = useState(false);

  const isEdit = mode === 'edit';
  const positionId = defaultDetail?.id;

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: defaultDetail
      ? mapPositionDetailToFormValues(defaultDetail, { blankName: mode === 'clone' })
      : createEmptyPositionFormValues(),
  });

  const { data: permissionCatalog } = useQuery({ ...getCrmPermissionsOptions() });

  const finish = (id: number) => {
    queryClient.invalidateQueries({ queryKey: getCrmPositionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getCrmPositionsByIdQueryKey({ path: { id } }) });
    queryClient.invalidateQueries({
      queryKey: getCrmPositionsByIdPermissionsQueryKey({ path: { id } }),
    });
    toast.success(isEdit ? '職位の変更を保存しました' : '職位を登録しました');
    router.push(navigate('/positions'));
  };

  const handleDuplicateNameError = (message: string | undefined) => {
    // 409 (role, name) 重複 — 職位名フィールドのインラインエラーとして表示 (FR-010)
    if (message?.includes('同名の職位')) {
      form.setError('position_name', { message: DUPLICATE_NAME_MESSAGE });
      scrollToFirstError();
      return true;
    }
    return false;
  };

  const createMutation = useMutation({
    ...postCrmPositionsMutation(),
    onSuccess: (result) => finish(result.id),
    onError: (error) => {
      if (handleDuplicateNameError(error.error)) return;
      toast.error(error.error || '職位の登録に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...patchCrmPositionsByIdMutation(),
    onSuccess: (result) => finish(result.id),
    onError: (error) => {
      if (handleDuplicateNameError(error.error)) return;
      toast.error(error.error || '職位の更新に失敗しました');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = form.handleSubmit((values) => {
    if (isEdit && positionId !== undefined) {
      updateMutation.mutate({ path: { id: positionId }, body: mapFormValuesToUpdateBody(values) });
    } else {
      createMutation.mutate({ body: mapFormValuesToCreateBody(values) });
    }
  }, scrollToFirstError);

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(navigate('/positions'));
  };

  return (
    <Form {...form}>
      <PageHeader
        breadcrumb={<BackLink label="職位マスター管理に戻る" onClick={handleCancel} />}
        title={PAGE_TITLES[mode]}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4"
      >
        <div className="mx-auto flex max-w-[960px] flex-col gap-6">
          <PositionFormBasicInfoSection
            isRoleLocked={isEdit}
            seedCsvDefaultsOnRoleChange={mode === 'create'}
          />
          <PositionFormPermissionsSection />

          <div className="flex items-center justify-end gap-2 border-t p-4">
            {form.formState.isSubmitted &&
              (form.formState.errors.position_name || form.formState.errors.role) && (
                <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
              )}
            <Button type="button" size="lg" variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting || !permissionCatalog}>
              {isSubmitting ? '保存中...' : isEdit ? '変更を保存する' : '登録する'}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              未保存の変更はすべて失われます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(navigate('/positions'))}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
