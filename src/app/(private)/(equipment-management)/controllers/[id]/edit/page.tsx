'use client';

import { useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
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
  getCrmControllersByIdOptions,
  getCrmControllersByIdQueryKey,
  getCrmControllersQueryKey,
  patchCrmControllersByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmControllersByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ControllerForm } from '../../_components/controller-form';
import {
  type ControllerFormSubmitValues,
  type ControllerFormValues,
  controllerFormSchema,
} from '../../_schemas/controller-form.schema';
import {
  controllerDetailToFormValues,
  controllerFormValuesToPatchBody,
} from '../../_utils/controller-form.util';

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

function ControllerEditForm({ controller, id }: { controller: ControllerDetail; id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const [discardOpen, setDiscardOpen] = useState(false);

  const form = useForm<ControllerFormValues, unknown, ControllerFormSubmitValues>({
    resolver: zodResolver(controllerFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: controllerDetailToFormValues(controller),
  });

  const { isDirty, isSubmitted, errors, dirtyFields } = useFormState({ control: form.control });

  const patchMutation = useMutation({
    ...patchCrmControllersByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCrmControllersByIdQueryKey({ path: { id } }) });
      queryClient.invalidateQueries({ queryKey: getCrmControllersQueryKey() });
      toast.success('接点制御装置の変更を保存しました');
      router.push(navigate('/controllers/[id]', id));
    },
    onError: () => {
      toast.error('接点制御装置の変更の保存に失敗しました');
    },
  });

  const onSubmit = (values: ControllerFormSubmitValues) => {
    if (!isDirty) return;
    patchMutation.mutate({
      path: { id },
      body: controllerFormValuesToPatchBody(values, dirtyFields),
    });
  };

  const handleSubmit = form.handleSubmit(onSubmit, scrollToFirstError);

  const handleCancel = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(navigate('/controllers/[id]', id));
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Form {...form}>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/controllers'), label: '店舗機器管理' },
            { url: navigate('/controllers/[id]', id), label: '接点制御装置詳細' },
            { label: '接点制御装置 編集' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <form onSubmit={handleSubmit}>
          <ControllerForm mode="edit" controllerId={id} />
        </form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] items-center justify-end gap-2">
          {isSubmitted && hasErrors ? (
            <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
          ) : null}
          <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!isDirty || patchMutation.isPending}
            onClick={handleSubmit}
          >
            {patchMutation.isPending ? '保存中...' : '更新'}
          </Button>
        </div>
      </div>

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
            <AlertDialogAction onClick={() => router.push(navigate('/controllers/[id]', id))}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}

export default function ControllerEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmControllersByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const controller = data;

  if (isLoading || isError || !controller || !id) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!controller}
        onRetry={() => refetch()}
        errorTitle="接点制御装置の取得に失敗しました"
      />
    );
  }

  return <ControllerEditForm key={id} controller={controller} id={id} />;
}
