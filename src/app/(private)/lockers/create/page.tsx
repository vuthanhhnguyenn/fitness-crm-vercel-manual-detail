'use client';

import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { getCrmLockersQueryKey, postCrmLockersMutation } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LockerForm } from '../_components/locker-form';
import {
  type LockerFormSubmitValues,
  type LockerFormValues,
  lockerFormSchema,
} from '../_schemas/locker-form.schema';
import { emptyLockerFormDefaults, lockerFormValuesToCreateBody } from '../_utils/locker-form.util';

export default function LockerCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<LockerFormValues, unknown, LockerFormSubmitValues>({
    resolver: zodResolver(lockerFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: emptyLockerFormDefaults,
  });

  const createMutation = useMutation({
    ...postCrmLockersMutation(),
    onSuccess: (res) => {
      toast.success(res.message || 'ロッカーを登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmLockersQueryKey() });
      router.push(navigate('/lockers/[id]', res.locker.id));
    },
    onError: () => {
      toast.error('ロッカーの登録に失敗しました');
    },
  });

  const onSubmit = (values: LockerFormSubmitValues) => {
    createMutation.mutate({
      body: lockerFormValuesToCreateBody(values),
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/lockers'), label: 'ロッカー管理' },
            { label: 'ロッカー設備 新規登録' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <LockerForm mode="create" />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(navigate('/lockers'))}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={createMutation.isPending}
            onClick={form.handleSubmit(onSubmit, scrollToFirstError)}
          >
            {createMutation.isPending ? '登録中...' : '入力内容を確認する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
