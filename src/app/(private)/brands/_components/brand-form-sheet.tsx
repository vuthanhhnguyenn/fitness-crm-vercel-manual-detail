'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetFooter } from '@/components/ui/sheet';

import {
  getCrmBrandsByIdQueryKey,
  getCrmBrandsQueryKey,
  patchCrmBrandsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { type BrandFormValues, brandFormSchema } from '../_schemas/brand-form.schema';
import type { BrandListItem } from './brand-table-columns';

const EMPTY_FORM_VALUES: BrandFormValues = {
  brandId: '',
  displayName: '',
};

function buildInitialValues(brand: BrandListItem | null): BrandFormValues {
  if (!brand) return EMPTY_FORM_VALUES;

  return {
    brandId: brand.brand_id,
    displayName: brand.display_name,
  };
}

interface BrandFormSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  brand: BrandListItem | null;
  onOpenChange: (open: boolean) => void;
}

export function BrandFormSheet({ open, mode, brand, onOpenChange }: BrandFormSheetProps) {
  const scrollToFirstError = useScrollToFirstError();
  const lastResetBrandIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const initialValues = buildInitialValues(brand);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema) as never,
    mode: 'onChange',
    defaultValues: initialValues,
  });

  const updateMutation = useMutation({
    ...patchCrmBrandsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'ブランド設定を保存しました');
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdQueryKey({ path: { id: response.brand.code } }),
      });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) return;

    // Reset only when opening for a different brand.
    if (lastResetBrandIdRef.current !== initialValues.brandId) {
      form.reset(initialValues);
      lastResetBrandIdRef.current = initialValues.brandId;
    }
  }, [open, form, initialValues]);

  useEffect(() => {
    if (!open) {
      lastResetBrandIdRef.current = null;
    }
  }, [open]);

  const title = mode === 'create' ? 'ブランド新規登録' : 'ブランド編集';

  // Derive from `errors`, not `formState.isValid`: the sheet is always mounted and gets
  // its record via a nullable prop, so it first mounts with the empty form values, which
  // fail the schema and latch `isValid` to false — RHF's `reset()`/`handleSubmit()` never
  // recompute it. `errors` is always rewritten from the full schema on submit.
  const hasFieldErrors = !!form.formState.errors.displayName || !!form.formState.errors.brandId;

  const handleSubmit = (values: BrandFormValues) => {
    // Defensive only: the sheet is opened exclusively from the row edit action, which
    // always sets both `mode='edit'` and `brand`. Not a field-level problem, so it is
    // surfaced as a toast rather than an error on `brandId`.
    if (mode !== 'edit' || !brand) {
      toast.error('ブランド設定の更新に失敗しました。後で再試行してください。');
      return;
    }

    const normalizedBrandId = values.brandId.trim().toLowerCase();

    updateMutation.mutate(
      {
        path: { id: brand.code },
        body: {
          display_name: values.displayName.trim(),
          brand_id: normalizedBrandId,
        },
      },
      {
        onError: () => {
          toast.error('ブランド設定の更新に失敗しました。後で再試行してください。');
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-[384px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[384px]">
        <div className="px-6 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <SheetDescription className="sr-only">{title}フォーム</SheetDescription>
        </div>
        <Separator />

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit, scrollToFirstError)}
          >
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        ブランド名
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: JOYFIT" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        ブランドID
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: joyfit" disabled={mode === 'edit'} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {mode === 'edit'
                          ? 'システム内部キーのため変更できません。'
                          : '英数字のみ。システム内部で使用されます。'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-600">費用（入会金・手数料）</p>
                  <p className="text-muted-foreground text-xs leading-5">
                    費用の設定はブランド詳細画面の「費用」タブで管理します。
                  </p>
                </div>
              </div>
            </div>

            <Separator />
            <SheetFooter className="gap-2 px-6 pt-4 pb-6">
              <Button
                type="button"
                variant="outline"
                className="h-8 w-full rounded-md text-sm"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90 h-8 w-full rounded-md text-sm"
                disabled={hasFieldErrors || updateMutation.isPending}
              >
                保存する
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
