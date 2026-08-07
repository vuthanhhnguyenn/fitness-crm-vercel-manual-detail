'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  getCrmMembersByIdQueryKey,
  postCrmMembersByIdGateStopMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { GateStopReason, GateStopScope } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

// ── GATE STOP REASON OPTIONS ─────────────────────────────────────────────────
const GATE_STOP_REASON_OPTIONS: { value: GateStopReason; label: string }[] = [
  { value: GateStopReason.NUISANCE, label: '迷惑行為' },
  { value: GateStopReason.UNPAID, label: '未納金' },
  { value: GateStopReason.FRAUDULENT_USE, label: '不正利用' },
  { value: GateStopReason.OTHER, label: 'その他' },
];

// ── Zod form schema ───────────────────────────────────────────────────────────
const gateStopFormSchema = z.object({
  scope: z.nativeEnum(GateStopScope, { message: '設定スコープは必須です' }),
  reason: z.nativeEnum(GateStopReason, { message: '設定理由は必須です' }),
  terminal_message: z.string().optional(),
  lock_after_message: z.boolean(),
});

type GateStopFormValues = z.infer<typeof gateStopFormSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface GateStopSetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
}

// ── GateStopSetSheet ──────────────────────────────────────────────────────────
export function GateStopSetSheet({
  open,
  onOpenChange,
  memberId,
}: Readonly<GateStopSetSheetProps>) {
  const queryClient = useQueryClient();

  const [scope, setScope] = useState<GateStopScope>(GateStopScope.ALL_STORES);

  const form = useForm<GateStopFormValues>({
    resolver: zodResolver(gateStopFormSchema),
    defaultValues: {
      scope: GateStopScope.ALL_STORES,
      reason: undefined,
      terminal_message: '',
      lock_after_message: false,
    },
  });

  const mutation = useMutation({
    ...postCrmMembersByIdGateStopMutation(),
    onSuccess: () => {
      toast.success('ゲートストップを設定しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      handleClose();
    },
    onError: () => {
      toast.error('ゲートストップの設定に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset({
        scope: GateStopScope.ALL_STORES,
        reason: undefined,
        terminal_message: '',
        lock_after_message: false,
      });
      setScope(GateStopScope.ALL_STORES);
    }, 300);
  };

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      path: { id: memberId },
      body: {
        scope: data.scope,
        reason: data.reason,
        terminal_message: data.terminal_message || undefined,
        lock_after_message: data.lock_after_message,
      },
    });
  });

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex w-120 flex-col gap-0 overflow-hidden p-0 sm:max-w-120">
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="size-4" />
              ゲートストップ設定
            </SheetTitle>
            <SheetDescription className="text-muted-foreground mt-1 text-xs">
              会員の入館を制限します
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Body */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6">
              {/* Scope */}
              <div className="flex flex-col gap-3 py-4">
                <Label className="text-sm font-medium">
                  設定スコープ <span className="text-destructive ml-1 text-xs">*</span>
                </Label>
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(v) => {
                            const val = v as GateStopScope;
                            field.onChange(val);
                            setScope(val);
                          }}
                          className="flex flex-col gap-2"
                        >
                          <label
                            htmlFor="gate-scope-all"
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors',
                              scope === GateStopScope.ALL_STORES
                                ? 'border-primary bg-primary/10'
                                : 'border-border',
                            )}
                          >
                            <RadioGroupItem
                              id="gate-scope-all"
                              value={GateStopScope.ALL_STORES}
                              className="mt-0.5"
                            />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">全店舗入館不可</span>
                              <span className="text-muted-foreground text-xs">
                                全ての店舗で入館を制限
                              </span>
                            </div>
                          </label>
                          <label
                            htmlFor="gate-scope-self"
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors',
                              scope === GateStopScope.OWN_STORE_ONLY
                                ? 'border-primary bg-primary/10'
                                : 'border-border',
                            )}
                          >
                            <RadioGroupItem
                              id="gate-scope-self"
                              value={GateStopScope.OWN_STORE_ONLY}
                              className="mt-0.5"
                            />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">自店舗のみ入館不可</span>
                              <span className="text-muted-foreground text-xs">
                                この店舗のみ入館を制限
                              </span>
                            </div>
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* Reason & message */}
              <div className="flex flex-col gap-4 py-4">
                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        設定理由 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v as GateStopReason)}
                        items={GATE_STOP_REASON_OPTIONS}
                      >
                        <FormControl>
                          <SelectTrigger id="gate-stop-reason" className="h-9 text-sm">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GATE_STOP_REASON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Terminal message */}
                <FormField
                  control={form.control}
                  name="terminal_message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        ゲート端末メッセージ{' '}
                        <span className="text-muted-foreground ml-1 text-xs">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="gate-stop-message"
                          rows={2}
                          placeholder="ゲート端末に表示するメッセージ"
                          className="resize-none text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lock after message */}
                <FormField
                  control={form.control}
                  name="lock_after_message"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox
                            id="gate-stop-lock"
                            checked={field.value}
                            onCheckedChange={(v) => field.onChange(v === true)}
                          />
                        </FormControl>
                        <Label
                          htmlFor="gate-stop-lock"
                          className="cursor-pointer text-sm leading-snug"
                        >
                          メッセージ確認後も入館不可にする
                        </Label>
                      </div>
                    </FormItem>
                  )}
                />

                <Alert className="border-warning/20 bg-warning/10">
                  <AlertDescription className="text-warning text-xs">
                    この設定はゲート端末に即時反映されます
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={mutation.isPending}
              >
                設定
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
