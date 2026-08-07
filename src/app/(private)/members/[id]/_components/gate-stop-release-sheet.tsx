'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

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
  deleteCrmMembersByIdGateStopMutation,
  getCrmMembersByIdQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { GateStopReleaseReason, GateStopScope } from '@/lib/api/types.gen';

// ── GATE STOP RELEASE REASON OPTIONS ─────────────────────────────────────────
const GATE_STOP_RELEASE_REASON_OPTIONS: { value: GateStopReleaseReason; label: string }[] = [
  { value: GateStopReleaseReason.ISSUE_RESOLVED, label: '問題解決済み' },
  { value: GateStopReleaseReason.WRONG_SETTING, label: '誤設定' },
  { value: GateStopReleaseReason.IDENTITY_CONFIRMED, label: '本人確認完了' },
  { value: GateStopReleaseReason.OTHER, label: 'その他' },
];

const GATE_STOP_SCOPE_LABELS: Record<string, string> = {
  [GateStopScope.ALL_STORES]: '全店舗',
  [GateStopScope.OWN_STORE_ONLY]: '自店舗のみ',
};

// ── Zod form schema ───────────────────────────────────────────────────────────
const gateStopReleaseFormSchema = z.object({
  reason: z.nativeEnum(GateStopReleaseReason, { message: '解除理由は必須です' }),
  detail: z.string().optional(),
  confirmed: z.boolean(),
});

type GateStopReleaseFormValues = z.infer<typeof gateStopReleaseFormSchema>;

// ── Gate stop info passed in ──────────────────────────────────────────────────
interface GateStopInfo {
  scope: string;
  set_at: string;
  set_by: string;
  terminal_message?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface GateStopReleaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  gateStopInfo: GateStopInfo | null | undefined;
}

// ── GateStopReleaseSheet ──────────────────────────────────────────────────────
export function GateStopReleaseSheet({
  open,
  onOpenChange,
  memberId,
  gateStopInfo,
}: Readonly<GateStopReleaseSheetProps>) {
  const queryClient = useQueryClient();

  const form = useForm<GateStopReleaseFormValues>({
    resolver: zodResolver(gateStopReleaseFormSchema),
    defaultValues: {
      reason: undefined,
      detail: '',
      confirmed: undefined,
    },
  });

  const [confirmed, setConfirmed] = useState(false);

  const mutation = useMutation({
    ...deleteCrmMembersByIdGateStopMutation(),
    onSuccess: () => {
      toast.success('ゲートストップを解除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      handleClose();
    },
    onError: () => {
      toast.error('ゲートストップの解除に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset({ reason: undefined, detail: '', confirmed: undefined });
      setConfirmed(false);
    }, 300);
  };

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      path: { id: memberId },
      body: {
        reason: data.reason,
        detail: data.detail || undefined,
      },
    });
  });

  const formatSetAt = (iso: string) => {
    try {
      return format(parseISO(iso), 'yyyy/MM/dd HH:mm');
    } catch {
      return iso;
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldOff className="size-4" />
              ゲートストップ解除
            </SheetTitle>
            <SheetDescription className="sr-only">ゲートストップ解除フォーム</SheetDescription>
          </SheetHeader>
        </div>

        {/* Body */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6">
              {/* Current gate stop info */}
              <div className="py-4">
                <div className="bg-muted/40 flex flex-col gap-2 rounded-md p-3">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">現在の設定</p>
                  {gateStopInfo ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <p className="text-muted-foreground text-xs">設定日時</p>
                        <p className="text-sm font-medium">{formatSetAt(gateStopInfo.set_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">設定者</p>
                        <p className="text-sm font-medium">{gateStopInfo.set_by}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">スコープ</p>
                        <p className="text-sm font-medium">
                          {GATE_STOP_SCOPE_LABELS[gateStopInfo.scope] ?? gateStopInfo.scope}
                        </p>
                      </div>
                      {gateStopInfo.terminal_message && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">メッセージ</p>
                          <p className="text-sm font-medium">{gateStopInfo.terminal_message}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">設定情報なし</p>
                  )}
                </div>
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* Release fields */}
              <div className="flex flex-col gap-4 py-4">
                {/* Release reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        解除理由 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v as GateStopReleaseReason)}
                        items={GATE_STOP_RELEASE_REASON_OPTIONS}
                      >
                        <FormControl>
                          <SelectTrigger id="release-reason" className="h-9 text-sm">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GATE_STOP_RELEASE_REASON_OPTIONS.map((option) => (
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

                {/* Detail */}
                <FormField
                  control={form.control}
                  name="detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        詳細 <span className="text-muted-foreground ml-1 text-xs">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          id="release-detail"
                          rows={2}
                          className="resize-none text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirmation checkbox */}
                <FormField
                  control={form.control}
                  name="confirmed"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-2 pt-1">
                        <FormControl>
                          <Checkbox
                            id="release-confirm"
                            checked={confirmed}
                            onCheckedChange={(v) => {
                              const checked = v === true;
                              setConfirmed(checked);
                              field.onChange(checked ? true : undefined);
                            }}
                          />
                        </FormControl>
                        <Label
                          htmlFor="release-confirm"
                          className="cursor-pointer text-sm leading-snug"
                        >
                          上記の内容を確認し、ゲートストップを解除します
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                disabled={!confirmed || mutation.isPending}
              >
                解除する
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
