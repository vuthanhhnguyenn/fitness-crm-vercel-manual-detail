'use client';

import { useFieldArray, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send, Users, X } from 'lucide-react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBrandsOptions,
  getCrmStaffsQueryKey,
  postCrmStaffsInviteMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { STAFF_ROLE_LABELS, StaffBrand, StaffRole } from '../_constants/constants';
import { type InviteStaffFormValues, inviteStaffSchema } from '../_schemas/invite-staff.schema';

// ─── Component ───────────────────────────────────────────────────────────────

interface InviteStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_BRAND = StaffBrand.ALL;
const DEFAULT_ROLE = StaffRole.STAFF;
const STAFF_ROLE_OPTIONS = (Object.values(StaffRole) as StaffRole[])
  .filter((role) => role !== StaffRole.SYSTEM)
  .map((role) => ({
    value: role,
    label: STAFF_ROLE_LABELS[role],
  }));

export function InviteStaffModal({ open, onOpenChange }: InviteStaffModalProps) {
  const queryClient = useQueryClient();

  const { data: brandsRes } = useQuery({
    ...getCrmBrandsOptions(),
    enabled: open,
  });
  const apiBrands =
    brandsRes?.brands?.map((brand) => ({
      value: brand.code,
      label: brand.display_name,
    })) ?? [];

  const form = useForm<InviteStaffFormValues>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      emails: '',
      brand: DEFAULT_BRAND,
      role: DEFAULT_ROLE,
      invitees: [],
    },
  });
  const {
    fields: inviteList,
    append,
    update,
    remove,
    replace,
  } = useFieldArray({
    control: form.control,
    name: 'invitees',
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      replace([]);
      form.reset({
        emails: '',
        brand: DEFAULT_BRAND,
        role: DEFAULT_ROLE,
        invitees: [],
      });
    }
    onOpenChange(nextOpen);
  };

  const inviteMutation = useMutation({
    ...postCrmStaffsInviteMutation(),
    onError: () => {
      toast.error('招待の送信に失敗しました');
    },
  });

  const addEmailsToList = () => {
    const emailInput = form.getValues('emails');
    const brand = form.getValues('brand');
    const role = form.getValues('role');
    const currentInvitees = form.getValues('invitees');

    const emails = emailInput
      .split('\n')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      form.setError('emails', {
        type: 'manual',
        message: 'メールアドレスを入力してください',
      });
      return;
    }

    const invalidEmail = emails.find((email) => !EMAIL_REGEX.test(email));
    if (invalidEmail) {
      form.setError('emails', {
        type: 'manual',
        message: '有効なメールアドレスを入力してください',
      });
      return;
    }

    const existingEmailSet = new Set(currentInvitees.map((item) => item.email.toLowerCase()));
    const uniqueEmails = emails.filter((email) => !existingEmailSet.has(email.toLowerCase()));

    if (uniqueEmails.length === 0) {
      form.setError('emails', {
        type: 'manual',
        message: '入力したメールアドレスはすでに追加されています',
      });
      return;
    }

    const newItems = uniqueEmails.map((email) => ({
      email,
      role,
      brand,
    }));

    append(newItems);
    form.clearErrors('emails');
    form.setValue('emails', '');
  };

  const updateInviteItem = <K extends 'role' | 'brand'>(
    index: number,
    key: K,
    value: InviteStaffFormValues['invitees'][number][K],
  ) => {
    const currentItem = form.getValues(`invitees.${index}`);
    if (!currentItem) return;
    update(index, { ...currentItem, [key]: value });
  };

  const removeInviteItem = (index: number) => {
    remove(index);
  };

  const onSubmit = async (values: InviteStaffFormValues) => {
    const { invitees } = values;

    if (invitees.length === 0) {
      form.setError('emails', {
        type: 'manual',
        message: '招待リストにメールアドレスを追加してください',
      });
      return;
    }

    try {
      await inviteMutation.mutateAsync({
        body: {
          invitees: invitees.map((invite) => ({
            email: invite.email,
            role: invite.role,
            brand: invite.brand,
          })),
        },
      });

      toast.success('招待メールを送信しました');
      queryClient.invalidateQueries({ queryKey: getCrmStaffsQueryKey() });
      handleOpenChange(false);
    } catch {
      // Error toast is handled by mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-[14px] p-0 sm:max-w-[560px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">スタッフを招待</DialogTitle>
            <DialogDescription>
              招待メールを送信します。受信者がメール内のリンクからアカウントを作成します。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(90vh-180px)] overflow-y-auto px-4 pb-0">
          <Form {...form}>
            <form
              id="invite-staff-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-md border p-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs">
                      招待時の権限 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value as StaffRole)}
                          items={STAFF_ROLE_OPTIONS}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full" size="sm">
                              <SelectValue placeholder="権限を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STAFF_ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">
                          招待時のブランド
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          items={apiBrands}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full" size="sm">
                              <SelectValue placeholder="ブランドを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {apiBrands.map((brand) => (
                              <SelectItem key={brand.value} value={brand.value}>
                                {brand.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="emails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs">
                        メールアドレス <span className="text-muted-foreground">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            'example@joyfit.co.jp\n複数人を招待する場合は改行で区切ってください'
                          }
                          rows={2}
                          className="max-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="text-muted-foreground h-9 w-full text-xs"
                  onClick={addEmailsToList}
                >
                  ＋ リストに追加
                </Button>
              </div>

              <div className="space-y-3 pb-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">招待リスト</p>
                  {inviteList.length > 0 ? (
                    <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
                      {inviteList.length}件
                    </span>
                  ) : null}
                </div>

                {inviteList.length === 0 ? (
                  <div className="border-border flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center">
                    <Users className="text-muted-foreground size-4" />
                    <p className="text-muted-foreground text-xs">
                      メールアドレスを入力して「リストに追加」を押してください
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1 md:max-h-[360px]">
                    {inviteList.map((invite, index) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                      >
                        <p className="max-w-[150px] flex-1 truncate text-xs">{invite.email}</p>
                        <div className="flex items-center gap-2">
                          <Select
                            value={invite.role}
                            onValueChange={(value) =>
                              updateInviteItem(index, 'role', value as StaffRole)
                            }
                            items={STAFF_ROLE_OPTIONS}
                          >
                            <SelectTrigger className="w-[148px]" size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STAFF_ROLE_OPTIONS.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={invite.brand}
                            onValueChange={(value) =>
                              updateInviteItem(index, 'brand', value as StaffBrand)
                            }
                            items={apiBrands}
                          >
                            <SelectTrigger className="w-[128px]" size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {apiBrands.map((brand) => (
                                <SelectItem key={brand.value} value={brand.value}>
                                  {brand.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => removeInviteItem(index)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="border-border border-t px-4 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-medium"
            onClick={() => handleOpenChange(false)}
            disabled={inviteMutation.isPending}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            form="invite-staff-form"
            size="sm"
            className="gap-1.5 font-medium"
            disabled={inviteMutation.isPending || inviteList.length === 0}
          >
            {inviteMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            {inviteMutation.isPending ? '送信中...' : '招待メールを送信'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
