'use client';

import type { MouseEvent, ReactElement } from 'react';
import { cloneElement, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
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
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmStaffsByIdOptions,
  getCrmStaffsQueryKey,
  postCrmStaffsByIdDeactivateMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { UserRole } from '@/types/permission.type';

import {
  type StaffDeactivateReasonSubmitValues,
  type StaffDeactivateReasonValues,
  staffDeactivateReasonSchema,
} from '../_schemas/staff-deactivate-dialog.schema';

type TriggerElement = ReactElement<{ onClick?: (event: MouseEvent) => void }>;

interface StaffDeactivateActionProps {
  staffId: string;
  staffName: string;
  /**
   * Optional custom trigger element (e.g. a row-menu item). Its `onClick` is
   * augmented (not replaced) to open this dialog — no `AlertDialogTrigger`
   * wrapper needed, since `open` here is already fully controlled.
   * If not provided, renders the default warning button.
   */
  trigger?: TriggerElement;
  /**
   * Fully external open state (e.g. a row-menu item that must live outside the
   * dropdown's own React tree — see staffs-table-columns.tsx ActionsCell). When
   * provided, no trigger is rendered by this component; the caller drives `open`.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Detail-page variant: adds an optional 無効化理由 textarea — src: staff-detail.tsx L353-370 */
  withReason?: boolean;
}

/**
 * Deactivate confirmation — title "スタッフを無効化しますか？", description, キャンセル /
 * 無効化する; confirming sets status to 無効 and shows a success toast naming the
 * affected staff member — src: staff-list.tsx L651-684
 */
export function StaffDeactivateAction({
  staffId,
  staffName,
  trigger,
  open: controlledOpen,
  onOpenChange,
  withReason = true,
}: StaffDeactivateActionProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const isSubmittingRef = useRef(false);

  const form = useForm<StaffDeactivateReasonValues, unknown, StaffDeactivateReasonSubmitValues>({
    resolver: zodResolver(staffDeactivateReasonSchema),
    mode: 'onChange',
    defaultValues: { reason: '' },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset();
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const deactivateMutation = useMutation({
    ...postCrmStaffsByIdDeactivateMutation(),
    onSuccess: () => {
      toast.success('スタッフを無効化しました', {
        description: `${staffName}はCRMにログインできなくなります。記録は保持されます。`,
      });
      queryClient.invalidateQueries({ queryKey: getCrmStaffsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmStaffsByIdOptions({ path: { id: staffId } }).queryKey,
      });
      handleOpenChange(false);
    },
    onError: () => {
      toast.error('スタッフの無効化に失敗しました');
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  // Deliberately not `form.handleSubmit(...)` — a ref read/write inside a callback
  // passed to a third-party function like react-hook-form's `handleSubmit` can't be
  // proven by the React Compiler to run only in an event handler, and gets flagged
  // (react-hooks/refs). `form.trigger()` awaited in our own plain function keeps the
  // same validation behavior while keeping every ref access directly in this handler.
  const handleConfirm = async () => {
    if (isSubmittingRef.current || deactivateMutation.isPending) return;
    // Set before the `await` below (not after) — otherwise several rapid clicks each
    // pass the guard check while the first call's `form.trigger()` is still pending.
    isSubmittingRef.current = true;
    const valid = await form.trigger();
    if (!valid) {
      isSubmittingRef.current = false;
      return;
    }
    const reason = (form.getValues('reason') ?? '').trim();
    deactivateMutation.mutate({
      path: { id: staffId },
      body: withReason && reason ? { reason } : {},
    });
  };

  const effectiveTrigger: TriggerElement | null =
    trigger ??
    (isControlled ? null : (
      <RoleGatedButton
        allowedRoles={[UserRole.Headquarter, UserRole.System]}
        denyTooltip="本部権限が必要です"
        variant="outline"
        size="sm"
        className="text-warning hover:text-warning w-full"
        disabled={deactivateMutation.isPending}
      >
        <Ban className="size-4" />
        無効化する
      </RoleGatedButton>
    ));

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {effectiveTrigger &&
        cloneElement(effectiveTrigger, {
          onClick: (event: MouseEvent) => {
            effectiveTrigger.props.onClick?.(event);
            setInternalOpen(true);
          },
        })}

      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {withReason ? 'このスタッフを無効化しますか？' : 'スタッフを無効化しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {withReason
              ? '無効化すると、このスタッフはCRMにログインできなくなります。記録は保持されます。後から有効化することができます。'
              : 'アカウントを無効状態にし、CRMにログインできなくします。記録は保持されます。'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {withReason && (
          <Form {...form}>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="py-2">
                  <FormLabel className="text-sm">無効化理由</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="無効化理由を入力してください（任意）"
                      rows={3}
                      disabled={deactivateMutation.isPending}
                      className="max-h-40"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivateMutation.isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={deactivateMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            無効化する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
