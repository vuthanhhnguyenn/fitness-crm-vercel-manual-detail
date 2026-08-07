'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

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

import { type BrandFormValues, brandFormSchema } from '../_schemas/brand-form.schema';

interface BrandFormSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues: BrandFormValues;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: BrandFormValues, onError: (message: string) => void) => void;
}

export function BrandFormSheet({
  open,
  mode,
  initialValues,
  isSubmitting,
  onOpenChange,
  onSave,
}: BrandFormSheetProps) {
  const scrollToFirstError = useScrollToFirstError();
  const lastResetBrandIdRef = useRef<string | null>(null);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema) as never,
    mode: 'onChange',
    defaultValues: initialValues,
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
  const handleSubmit = (values: BrandFormValues) => {
    form.clearErrors('brandId');
    onSave(values, (message) => {
      form.setError('brandId', {
        type: 'manual',
        message,
      });
      scrollToFirstError();
    });
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
                        <Input
                          {...field}
                          placeholder="例: joyfit"
                          onChange={(event) => {
                            if (form.formState.errors.brandId?.type === 'manual') {
                              form.clearErrors('brandId');
                            }
                            field.onChange(event.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        英数字のみ。システム内部で使用されます。
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
                disabled={!form.formState.isValid || isSubmitting}
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
