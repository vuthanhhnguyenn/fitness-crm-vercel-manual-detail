'use client';

import { useForm } from 'react-hook-form';

import { useAuthUser } from '@/contexts/auth-user.context';
import { formatDateMDWeekday } from '@/utils/date.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  deleteCrmLessonSchedulesByScheduleIdMemosByMemoIdMutation,
  getCrmLessonSchedulesByScheduleIdMemosQueryKey,
  postCrmLessonSchedulesByScheduleIdMemosMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem, MemoListResponse, SessionMemo } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  type GroupMemoFormValues,
  type PersonalMemoFormValues,
  groupMemoFormSchema,
  personalMemoFormSchema,
} from '../_schemas/session-memo-form.schema';
import { isOwnSessionScope } from '../_utils/session-scope.util';

interface SessionMemoCardProps {
  scheduleId: string;
  schedule: LessonScheduleListItem;
  memosData: MemoListResponse;
}

export function SessionMemoCard({ scheduleId, schedule, memosData }: SessionMemoCardProps) {
  const isPersonalSession = schedule.lesson_type === 'personal';
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuthUser();

  // FR-011 / FR-S001 — only roles with memo-manage may record/delete memos;
  // Trainer is further scoped to their own session.
  const canManageMemo =
    hasPermission(Permission.LessonsMemoManage) && isOwnSessionScope(user, schedule);

  const memoQueryKey = getCrmLessonSchedulesByScheduleIdMemosQueryKey({
    path: { scheduleId },
  });

  const createMemo = useMutation({
    ...postCrmLessonSchedulesByScheduleIdMemosMutation(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: memoQueryKey });
      const previous = queryClient.getQueryData<MemoListResponse>(memoQueryKey);
      const optimisticMemo: SessionMemo = {
        id: `temp-${Date.now()}`,
        schedule_id: scheduleId,
        content: variables.body?.content ?? '',
        author_id: user?.id ?? 'ST001',
        author_name: user?.name ?? '田中 花子',
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      queryClient.setQueryData<MemoListResponse>(memoQueryKey, (old) => ({
        memos: [optimisticMemo, ...(old?.memos ?? [])],
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success('メモを保存しました');
      queryClient.invalidateQueries({ queryKey: memoQueryKey });
    },
    onError: (_err, _variables, context) => {
      toast.error('メモの保存に失敗しました');
      if (context?.previous) queryClient.setQueryData(memoQueryKey, context.previous);
    },
  });

  const deleteMemo = useMutation({
    ...deleteCrmLessonSchedulesByScheduleIdMemosByMemoIdMutation(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: memoQueryKey });
      const previous = queryClient.getQueryData<MemoListResponse>(memoQueryKey);
      queryClient.setQueryData<MemoListResponse>(memoQueryKey, (old) => ({
        memos: (old?.memos ?? []).filter((m) => m.id !== variables.path.memoId),
      }));
      return { previous };
    },
    onSuccess: () => {
      toast.success('メモを削除しました');
      queryClient.invalidateQueries({ queryKey: memoQueryKey });
    },
    onError: (_err, _variables, context) => {
      toast.error('メモの削除に失敗しました');
      if (context?.previous) queryClient.setQueryData(memoQueryKey, context.previous);
    },
  });

  const handleSave = (content: string) => {
    createMemo.mutate({
      path: { scheduleId },
      body: { content, author_id: user?.id, author_name: user?.name },
    });
  };

  const handleDelete = (memoId: string) => {
    deleteMemo.mutate({
      path: { scheduleId, memoId },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">セッションメモ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing memos — scroll internally so a long list never scrolls the page */}
        <div className="max-h-90 space-y-3 overflow-y-auto">
          {memosData.memos.map((memo) => (
            <div key={memo.id} className="bg-muted/50 space-y-1 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{formatDateMDWeekday(memo.created_at)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[10px]">{memo.author_name}</span>
                  {canManageMemo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive h-5 w-5 p-0"
                      onClick={() => handleDelete(memo.id)}
                      disabled={deleteMemo.isPending}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                {memo.content}
              </p>
            </div>
          ))}

          {memosData.memos.length === 0 && (
            <p className="text-muted-foreground py-2 text-center text-xs">メモはありません</p>
          )}
        </div>

        {/* New memo input */}
        {canManageMemo &&
          (isPersonalSession ? (
            <PersonalMemoForm onSave={handleSave} isPending={createMemo.isPending} />
          ) : (
            <GroupMemoForm onSave={handleSave} isPending={createMemo.isPending} />
          ))}
      </CardContent>
    </Card>
  );
}

interface MemoFormProps {
  onSave: (content: string) => void;
  isPending: boolean;
}

const GROUP_DEFAULT_VALUES: GroupMemoFormValues = { content: '' };

function GroupMemoForm({ onSave, isPending }: MemoFormProps) {
  const form = useForm<GroupMemoFormValues>({
    resolver: zodResolver(groupMemoFormSchema),
    mode: 'onChange',
    defaultValues: GROUP_DEFAULT_VALUES,
  });

  const onSubmit = (values: GroupMemoFormValues) => {
    onSave(values.content.trim());
    form.reset(GROUP_DEFAULT_VALUES);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-[100px] text-sm"
                  placeholder="クラスの実施記録、参加者の様子、次回への申し送りなど"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 w-full text-xs"
          disabled={!form.formState.isValid || isPending}
        >
          メモを保存
        </Button>
      </form>
    </Form>
  );
}

const PERSONAL_DEFAULT_VALUES: PersonalMemoFormValues = {
  menu: '',
  weight: '',
  reps: '',
  condition: '',
  handover: '',
};

function buildPersonalMemoContent(values: PersonalMemoFormValues): string {
  return [
    values.menu?.trim() && `実施メニュー: ${values.menu.trim()}`,
    values.weight?.trim() && `重量: ${values.weight.trim()}`,
    values.reps?.trim() && `回数: ${values.reps.trim()}`,
    values.condition?.trim() && `会員の状態: ${values.condition.trim()}`,
    values.handover?.trim() && `次回への申し送り: ${values.handover.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function PersonalMemoForm({ onSave, isPending }: MemoFormProps) {
  const form = useForm<PersonalMemoFormValues>({
    resolver: zodResolver(personalMemoFormSchema),
    mode: 'onChange',
    defaultValues: PERSONAL_DEFAULT_VALUES,
  });

  const onSubmit = (values: PersonalMemoFormValues) => {
    const content = buildPersonalMemoContent(values);
    if (!content) return;
    onSave(content);
    form.reset(PERSONAL_DEFAULT_VALUES);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="menu"
          render={({ field }) => (
            <FormItem>
              <Label className="mb-1 block text-xs font-medium">実施メニュー</Label>
              <FormControl>
                <Input {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <Label className="mb-1 block text-xs font-medium">重量</Label>
                <FormControl>
                  <Input {...field} className="h-8 text-sm" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reps"
            render={({ field }) => (
              <FormItem>
                <Label className="mb-1 block text-xs font-medium">回数</Label>
                <FormControl>
                  <Input {...field} className="h-8 text-sm" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <Label className="mb-1 block text-xs font-medium">会員の状態</Label>
              <FormControl>
                <Textarea {...field} className="min-h-[60px] text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="handover"
          render={({ field }) => (
            <FormItem>
              <Label className="mb-1 block text-xs font-medium">次回への申し送り</Label>
              <FormControl>
                <Textarea {...field} className="min-h-[60px] text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 w-full text-xs"
          disabled={!form.formState.isValid || isPending}
        >
          メモを保存
        </Button>
      </form>
    </Form>
  );
}
