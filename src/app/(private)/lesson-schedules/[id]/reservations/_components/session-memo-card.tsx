'use client';

import { useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

import {
  deleteCrmLessonSchedulesByScheduleIdMemosByMemoIdMutation,
  getCrmLessonSchedulesByScheduleIdMemosQueryKey,
  postCrmLessonSchedulesByScheduleIdMemosMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { MemoListResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

interface SessionMemoCardProps {
  scheduleId: string;
  memosData: MemoListResponse;
}

function formatMemoDate(iso: string): string {
  try {
    return format(new Date(iso), 'M/d（E）', { locale: ja });
  } catch {
    return iso;
  }
}

export function SessionMemoCard({ scheduleId, memosData }: SessionMemoCardProps) {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthUser();

  // FR-011 / FR-S001 — only roles with memo-manage may record/delete memos.
  const canManageMemo = hasPermission(Permission.LessonsMemoManage);

  const memoQueryKey = getCrmLessonSchedulesByScheduleIdMemosQueryKey({
    path: { scheduleId },
  });

  const createMemo = useMutation({
    ...postCrmLessonSchedulesByScheduleIdMemosMutation(),
    onSuccess: () => {
      toast.success('メモを保存しました');
      setContent('');
      queryClient.invalidateQueries({ queryKey: memoQueryKey });
    },
    onError: () => {
      toast.error('メモの保存に失敗しました');
    },
  });

  const deleteMemo = useMutation({
    ...deleteCrmLessonSchedulesByScheduleIdMemosByMemoIdMutation(),
    onSuccess: () => {
      toast.success('メモを削除しました');
      queryClient.invalidateQueries({ queryKey: memoQueryKey });
    },
    onError: () => {
      toast.error('メモの削除に失敗しました');
    },
  });

  const handleSave = () => {
    if (!content.trim()) return;
    createMemo.mutate({
      path: { scheduleId },
      body: { content: content.trim() },
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
        {/* Existing memos */}
        {memosData.memos.map((memo) => (
          <div key={memo.id} className="bg-muted/50 space-y-1 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{formatMemoDate(memo.created_at)}</span>
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

        {/* New memo input */}
        {canManageMemo && (
          <>
            <Textarea
              className="min-h-[100px] text-sm"
              placeholder="クラスの実施記録、参加者の様子、次回への申し送りなど"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button
              size="sm"
              className="h-8 w-full text-xs"
              onClick={handleSave}
              disabled={!content.trim() || createMemo.isPending}
            >
              メモを保存
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
