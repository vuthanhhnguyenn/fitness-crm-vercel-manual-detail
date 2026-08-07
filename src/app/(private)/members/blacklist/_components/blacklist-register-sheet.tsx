'use client';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBlacklistQueryKey,
  postCrmBlacklistMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { BLACKLIST_MANUAL_REASON_LABEL } from '../_constants/blacklist.constants';
import {
  RegisterBlacklistFormSchema,
  type RegisterBlacklistFormValues,
} from '../_schemas/register-blacklist-form.schema';

interface BlacklistRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlacklistRegisterSheet({ open, onOpenChange }: BlacklistRegisterSheetProps) {
  const queryClient = useQueryClient();

  const form = useForm<RegisterBlacklistFormValues>({
    resolver: zodResolver(RegisterBlacklistFormSchema),
    defaultValues: {
      memberId: '',
      memberName: '',
      reason: undefined,
      memo: '',
    },
  });

  const { mutate, isPending } = useMutation({
    ...postCrmBlacklistMutation(),
    onSuccess: () => {
      toast.success('ブラックリストに登録しました');
      queryClient.invalidateQueries({ queryKey: getCrmBlacklistQueryKey() });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error('登録に失敗しました。もう一度お試しください。');
    },
  });

  const onSubmit = (data: RegisterBlacklistFormValues) => {
    mutate({ body: data });
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const reasonOptions = Object.entries(BLACKLIST_MANUAL_REASON_LABEL).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-120 flex-col gap-0 overflow-hidden p-0 sm:max-w-120">
        {/* ヘッダー */}
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="text-sm font-semibold">ブラックリスト手動登録</SheetTitle>
            <SheetDescription className="sr-only">
              対象会員をブラックリストに手動登録します
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* スクロール領域 */}
        <div className="flex-1 overflow-y-auto px-6">
          <Form {...form}>
            <form id="blacklist-register-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 py-4">
                {/* 会員ID */}
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        会員ID
                        <span className="text-destructive ml-2">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="例：USR-00123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 氏名 */}
                <FormField
                  control={form.control}
                  name="memberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        氏名
                        <span className="text-destructive ml-2">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="例：田中 次郎" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 登録理由 */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        登録理由
                        <span className="text-destructive ml-2">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        items={reasonOptions}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="理由を選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reasonOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* メモ */}
                <FormField
                  control={form.control}
                  name="memo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        メモ
                        <span className="text-muted-foreground ml-2 text-xs font-normal">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="補足情報を入力してください" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* 注意アラート */}
              <div className="py-4">
                <Alert className="border-warning/20 bg-warning/10 text-warning">
                  <TriangleAlert className="size-4" />
                  <AlertDescription className="text-sm">
                    ブラックリストに登録された会員の個人情報は削除できなくなります
                  </AlertDescription>
                </Alert>
              </div>
            </form>
          </Form>
        </div>

        {/* フッター */}
        <div className="flex shrink-0 items-center gap-2 border-t p-4">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            type="submit"
            form="blacklist-register-form"
            variant="destructive"
            className="flex-1"
            disabled={!form.formState.isDirty || !form.formState.isValid || isPending}
          >
            {isPending ? '登録中...' : '登録'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
