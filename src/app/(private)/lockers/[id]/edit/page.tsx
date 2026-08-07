'use client';

import { useForm, useFormState } from 'react-hook-form';

import { useParams, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmLockersByIdOptions,
  getCrmLockersByIdQueryKey,
  getCrmLockersQueryKey,
  patchCrmLockersByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LockerForm } from '../../_components/locker-form';
import {
  type LockerFormSubmitValues,
  type LockerFormValues,
  lockerFormSchema,
} from '../../_schemas/locker-form.schema';
import {
  lockerDetailToFormValues,
  lockerFormValuesToUpdateBody,
} from '../../_utils/locker-form.util';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

function LockerEditForm({ locker, id }: { locker: LockerDetail; id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<LockerFormValues, unknown, LockerFormSubmitValues>({
    resolver: zodResolver(lockerFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: lockerDetailToFormValues(locker),
  });

  const { isDirty } = useFormState({ control: form.control });

  const patchMutation = useMutation({
    ...patchCrmLockersByIdMutation(),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCrmLockersByIdQueryKey({ path: { id } }) }),
        queryClient.invalidateQueries({
          queryKey: getCrmLockersQueryKey(),
          refetchType: 'all',
        }),
      ]);
      toast.success(res.message || 'ロッカー情報を更新しました');
      router.push(navigate('/lockers/[id]', res.locker.id));
    },
    onError: () => {
      toast.error('ロッカー情報の更新に失敗しました');
    },
  });

  const onSubmit = (values: LockerFormSubmitValues) => {
    patchMutation.mutate({
      path: { id },
      body: lockerFormValuesToUpdateBody(values),
    });
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (!isDirty) return;
    onSubmit(values);
  }, scrollToFirstError);

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/lockers'), label: 'ロッカー管理' },
            { url: navigate('/lockers/[id]', id), label: 'ロッカー詳細' },
            { label: 'ロッカー設備 編集' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <LockerForm mode="edit" lockerId={id} />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(navigate('/lockers/[id]', id))}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!isDirty || patchMutation.isPending}
            onClick={handleSubmit}
          >
            {patchMutation.isPending ? '保存中...' : '変更を保存する'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LockerEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmLockersByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const locker = data?.locker;

  if (isLoading || isError || !locker || !id) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!locker}
        onRetry={() => refetch()}
        errorTitle="ロッカー情報の取得に失敗しました"
      />
    );
  }

  return <LockerEditForm key={id} locker={locker} id={id} />;
}
