'use client';

import { useState } from 'react';
import { useForm, useFormState } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
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
  getCrmEquipmentQueryKey,
  getCrmEquipmentSummaryQueryKey,
  postCrmEquipmentMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { EquipmentForm } from '../_components/equipment-form';
import {
  type EquipmentFormSubmitValues,
  type EquipmentFormValues,
  equipmentFormSchema,
} from '../_schemas/equipment-form.schema';
import {
  emptyEquipmentFormDefaults,
  equipmentFormValuesToBody,
} from '../_utils/equipment-form.util';

export default function EquipmentCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const [discardOpen, setDiscardOpen] = useState(false);

  const form = useForm<EquipmentFormValues, unknown, EquipmentFormSubmitValues>({
    resolver: zodResolver(equipmentFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: emptyEquipmentFormDefaults,
  });

  const { isDirty, isSubmitted, errors } = useFormState({ control: form.control });

  const createMutation = useMutation({
    ...postCrmEquipmentMutation(),
    onSuccess: () => {
      form.reset(form.getValues());
      toast.success('接続機器を登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmEquipmentQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmEquipmentSummaryQueryKey() });
      router.push(navigate('/equipment'));
    },
    onError: () => {
      toast.error('接続機器の登録に失敗しました');
    },
  });

  const onSubmit = (values: EquipmentFormSubmitValues) => {
    createMutation.mutate({ body: equipmentFormValuesToBody(values) });
  };

  const handleSubmit = form.handleSubmit(onSubmit, scrollToFirstError);

  const handleCancel = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(navigate('/equipment'));
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Form {...form}>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/equipment'), label: '接続機器管理' },
            { label: '接続機器 新規登録' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <form onSubmit={handleSubmit}>
          <EquipmentForm mode="create" />
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
            disabled={createMutation.isPending}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? '登録中...' : '登録'}
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
            <AlertDialogAction onClick={() => router.push(navigate('/equipment'))}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
