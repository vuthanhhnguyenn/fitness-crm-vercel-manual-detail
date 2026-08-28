'use client';

import { useForm, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBlacklistQueryKey,
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  postCrmMembersByIdBlacklistMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { BlacklistReasonCategory } from '@/lib/api/types.gen';

/**
 * A-01 FR-074 — this dialog and the blacklist list's Sheet register through the same
 * endpoint with the same payload, so they share one option list, one schema and one set of
 * defaults rather than each keeping a copy. `equipment_damage` is absent from both: the
 * contract retains it for migrated legacy rows only, and no registration form offers it.
 */
import { BLACKLIST_REASON_OPTIONS } from '../../blacklist/_constants/blacklist.constants';
import {
  REGISTER_BLACKLIST_DEFAULT_VALUES,
  RegisterBlacklistFormSchema,
  type RegisterBlacklistFormValues,
} from '../../blacklist/_schemas/register-blacklist-form.schema';

// ── Props ─────────────────────────────────────────────────────────────────────
interface BlacklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  memberNumber: string;
}

// ── BlacklistDialog (ブラックリスト登録) ────────────────────────────────────────
export function BlacklistDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberNumber,
}: Readonly<BlacklistDialogProps>) {
  const queryClient = useQueryClient();

  const form = useForm<RegisterBlacklistFormValues>({
    resolver: zodResolver(RegisterBlacklistFormSchema),
    mode: 'onSubmit',
    defaultValues: REGISTER_BLACKLIST_DEFAULT_VALUES,
  });
  // Drives the footer button; RHF is the single source of truth for the field state
  const reason = useWatch({ control: form.control, name: 'reason' });

  const mutation = useMutation({
    ...postCrmMembersByIdBlacklistMutation(),
    onSuccess: () => {
      toast.success('ブラックリストに登録しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmBlacklistQueryKey() });
      handleClose();
    },
    /*
     * No local `onError`: the server's own message is what the operator needs — most often
     * the 409 「この会員はすでにブラックリストに登録されています。」 — and the shared
     * MutationCache handler already surfaces it verbatim. A generic toast here would replace
     * that reason with nothing.
     */
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset(REGISTER_BLACKLIST_DEFAULT_VALUES);
    }, 300);
  };

  const handleExecute = form.handleSubmit((data) => {
    mutation.mutate({
      path: { id: memberId },
      /**
       * v0.4 — the single chosen reason travels as a one-element `reason_categories`
       * array. The dialog stays single-select; only the wire shape changed (FR-074).
       */
      body: { reason_categories: [data.reason], memo: data.memo?.trim() || undefined },
    });
  });

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ブラックリストに登録しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。登録後、会員の個人情報は削除不可になります。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 px-1 pb-2">
          {/* Target member */}
          <div className="space-y-1 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">対象会員</span>
              <span className="font-medium">{memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">会員ID</span>
              <span className="font-medium">{memberNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">登録日</span>
              <span className="text-xs">本日（実行時に自動記録）</span>
            </div>
          </div>

          <Form {...form}>
            {/* Registration reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="text-sm font-medium">
                    登録理由 <span className="text-destructive ml-1 text-xs">*</span>
                  </FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v as BlacklistReasonCategory)}
                    disabled={mutation.isPending}
                    items={BLACKLIST_REASON_OPTIONS}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="理由を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BLACKLIST_REASON_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Memo */}
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel htmlFor="blacklist-memo" className="text-sm font-medium">
                    メモ
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      id="blacklist-memo"
                      placeholder="補足事項があれば入力..."
                      className="min-h-20 resize-none text-sm"
                      // The shared schema caps `memo`; enforce it where the operator can see
                      // it, rather than surfacing the cap as a validation error after submit.
                      maxLength={TEXTAREA_MAX_LENGTH}
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            disabled={!reason || mutation.isPending}
            onClick={handleExecute}
          >
            登録する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
