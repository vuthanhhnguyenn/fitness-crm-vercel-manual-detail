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

import { getCrmStoresQueryKey, postCrmStoresMutation } from '@/lib/api/@tanstack/react-query.gen';
import { StoreListStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { StoreForm } from '../_components/store-form';
import {
  type StoreFormSubmitValues,
  type StoreFormValues,
  storeFormSchema,
} from '../_schemas/store-form.schema';

const emptyDefaults: StoreFormValues = {
  name: '',
  brand: '',
  operating_company_name: '',
  area: '',
  postal_code: '',
  prefecture: '',
  address: '',
  email: '',
  phone: '',
  club_code: '',
  accounting_code: '',
  is_fc: false,
  status: StoreListStatus.OPERATING,
  interview_url: '',
  google_map_url: '',
  x_url: '',
  instagram_url: '',
  line_url: '',
  facebook_url: '',
  youtube_url: '',
  store_photos: [],
  floor_map_url: '',
};

export default function StoreCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<StoreFormValues, unknown, StoreFormSubmitValues>({
    resolver: zodResolver(storeFormSchema) as any,
    mode: 'onSubmit',
    defaultValues: emptyDefaults,
  });

  const createMutation = useMutation({
    ...postCrmStoresMutation(),
    onSuccess: (res) => {
      toast.success(res.message || '店舗を作成しました');
      queryClient.invalidateQueries({ queryKey: getCrmStoresQueryKey() });
      router.push(navigate('/stores/[id]', res.store.id));
    },
    onError: () => {
      toast.error('店舗の作成に失敗しました');
    },
  });

  const onSubmit = (values: StoreFormSubmitValues) => {
    const { area, club_code, operating_company_name, ...rest } = values;
    createMutation.mutate({
      body: {
        ...rest,
        operating_company_name: operating_company_name || undefined,
        ...(area !== undefined ? { area } : {}),
        ...(club_code !== undefined ? { club_code } : {}),
      },
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <BreadcrumbNav
          items={[{ url: navigate('/stores'), label: '店舗管理' }, { label: '店舗新規登録' }]}
          variant="section"
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-28">
        <div className="py-4">
          <h1 className="text-xl font-bold">店舗新規登録</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}>
            <StoreForm />
          </form>
        </Form>
      </div>

      <div className="bg-background/95 fixed right-0 bottom-0 left-0 border-t px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push(navigate('/stores'))}>
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={createMutation.isPending}
            onClick={form.handleSubmit(onSubmit, scrollToFirstError)}
          >
            {createMutation.isPending ? '登録中...' : '登録する'}
          </Button>
        </div>
      </div>
    </div>
  );
}
