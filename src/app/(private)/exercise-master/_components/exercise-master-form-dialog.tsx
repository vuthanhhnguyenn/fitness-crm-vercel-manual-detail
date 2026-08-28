'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { FormMode } from '../_constants/constants';
import {
  type ExerciseMasterFormSubmitValues,
  type ExerciseMasterFormValues,
  exerciseMasterFormSchema,
} from '../_schemas/exercise-master-form.schema';

interface ExerciseMasterFormDialogProps {
  open: boolean;
  mode: FormMode;
  label: string;
  isSubmitting: boolean;
  initialValues: ExerciseMasterFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExerciseMasterFormSubmitValues) => void;
}

export function ExerciseMasterFormDialog({
  open,
  mode,
  label,
  isSubmitting,
  initialValues,
  onOpenChange,
  onSubmit,
}: ExerciseMasterFormDialogProps) {
  const form = useForm<ExerciseMasterFormValues, unknown, ExerciseMasterFormSubmitValues>({
    resolver: zodResolver(exerciseMasterFormSchema) as never,
    mode: 'onChange',
    defaultValues: initialValues,
  });

  const title = mode === 'create' ? `${label}を新規登録` : `${label}を編集`;
  const requiredLabel = <span className="text-destructive ml-1">*</span>;

  useEffect(() => {
    if (open) {
      form.reset(initialValues);
      return;
    }

    form.reset(initialValues);
  }, [form, initialValues, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? `${label}のコード・名称・説明・表示順を登録します。`
              : `${label}の名称・説明・表示順を更新します。`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>コード{mode === 'create' && requiredLabel}</FormLabel>
                  {mode === 'create' ? (
                    <>
                      <FormControl>
                        <Input placeholder="英数字・アンダースコア" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </>
                  ) : (
                    <p className="text-muted-foreground bg-muted/30 rounded-lg border px-3 py-2 text-sm">
                      {field.value}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称{requiredLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder="名称を入力" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea placeholder="説明を入力" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表示順{requiredLabel}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step={1} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={mode === 'create' ? 'bg-black text-white hover:bg-black/90' : undefined}
              >
                {mode === 'create' ? '登録する' : '変更を保存する'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
