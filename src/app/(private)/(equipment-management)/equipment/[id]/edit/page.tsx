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
  getCrmEquipmentByIdOptions,
  getCrmEquipmentByIdQueryKey,
  getCrmEquipmentQueryKey,
  patchCrmEquipmentByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { EquipmentForm } from '../../_components/equipment-form';
import {
  type EquipmentFormSubmitValues,
  type EquipmentFormValues,
  equipmentFormSchema,
} from '../../_schemas/equipment-form.schema';
import {
  equipmentDetailToFormValues,
  equipmentFormValuesToPatchBody,
} from '../../_utils/equipment-form.util';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

function EquipmentEditForm({ equipment, id }: { equipment: EquipmentDetail; id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const [discardOpen, setDiscardOpen] = useState(false);

  const form = useForm<EquipmentFormValues, unknown, EquipmentFormSubmitValues>({
    resolver: zodResolver(equipmentFormSchema) as never,
    mode: 'onSubmit',
    defaultValues: equipmentDetailToFormValues(equipment),
  });

  const { isDirty, isSubmitted, errors, dirtyFields } = useFormState({ control: form.control });

  const patchMutation = useMutation({
    ...patchCrmEquipmentByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCrmEquipmentByIdQueryKey({ path: { id } }) });
      queryClient.invalidateQueries({ queryKey: getCrmEquipmentQueryKey() });
      toast.success('接続機器の変更を保存しました');
      router.push(navigate('/equipment/[id]', id));
    },
    onError: () => {
      toast.error('接続機器の変更の保存に失敗しました');
    },
  });

  const onSubmit = (values: EquipmentFormSubmitValues) => {
    if (!isDirty) return;
    patchMutation.mutate({
      path: { id },
      body: equipmentFormValuesToPatchBody(values, dirtyFields),
    });
  };

  const handleSubmit = form.handleSubmit(onSubmit, scrollToFirstError);

  const handleCancel = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(navigate('/equipment/[id]', id));
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Form {...form}>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[
            { url: navigate('/equipment'), label: '接続機器管理' },
            { url: navigate('/equipment/[id]', id), label: '接続機器詳細' },
            { label: '接続機器 編集' },
          ]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-[960px] px-4 pt-4 pb-28">
        <form onSubmit={handleSubmit}>
          <EquipmentForm mode="edit" equipmentId={id} />
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
            <AlertDialogAction onClick={() => router.push(navigate('/equipment/[id]', id))}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}

export default function EquipmentEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmEquipmentByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const equipment = data?.equipment;

  if (isLoading || isError || !equipment || !id) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!equipment}
        onRetry={() => refetch()}
        errorTitle="接続機器の取得に失敗しました"
      />
    );
  }

  return <EquipmentEditForm key={id} equipment={equipment} id={id} />;
}
