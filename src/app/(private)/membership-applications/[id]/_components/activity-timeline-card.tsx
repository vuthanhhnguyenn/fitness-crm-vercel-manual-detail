'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { useCallback, useState } from 'react';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import {
  deleteCrmMembershipApplicationsByIdMemosByMemoIdMutation,
  getCrmMembershipApplicationsByIdOptions,
  postCrmMembershipApplicationsByIdMemosMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import type { ApplicationDetail } from './membership-application.utils';

interface ActivityTimelineCardProps {
  initialTimeline: ApplicationDetail['timeline'];
  applicationId: string;
}

export function ActivityTimelineCard({
  initialTimeline,
  applicationId,
}: Readonly<ActivityTimelineCardProps>) {
  const queryClient = useQueryClient();
  const [memoText, setMemoText] = useState('');
  const [deletingMemoId, setDeletingMemoId] = useState<string | null>(null);

  function invalidateApplication() {
    void queryClient.invalidateQueries(
      getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
    );
  }

  const addMemoMutation = useMutation({
    ...postCrmMembershipApplicationsByIdMemosMutation(),
    onSuccess: () => {
      setMemoText('');
      invalidateApplication();
      toast.success('メモを追加しました');
    },
    onError: () => {
      toast.error('メモの追加に失敗しました');
    },
  });

  const deleteMemoMutation = useMutation({
    ...deleteCrmMembershipApplicationsByIdMemosByMemoIdMutation(),
    onSuccess: () => {
      invalidateApplication();
      toast.success('メモを削除しました');
    },
    onError: () => {
      toast.error('メモの削除に失敗しました');
    },
    onSettled: () => setDeletingMemoId(null),
  });

  const handleAddMemo = useCallback(() => {
    const trimmed = memoText.trim();
    if (!trimmed) return;
    addMemoMutation.mutate({ path: { id: applicationId }, body: { content: trimmed } });
  }, [memoText, applicationId, addMemoMutation]);

  const handleDeleteMemo = useCallback(
    (memoId: string) => {
      setDeletingMemoId(memoId);
      deleteMemoMutation.mutate({ path: { id: applicationId, memoId } });
    },
    [applicationId, deleteMemoMutation],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">対応履歴・メモ</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-0">
          {initialTimeline.map((entry, i) => {
            const isSystem = entry.kind === 'system';
            return (
              <div key={entry.id} className="group flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-2 size-2.5 shrink-0 rounded-full ${isSystem ? 'bg-muted-foreground' : 'bg-primary'}`}
                  />
                  {i < initialTimeline.length - 1 && <div className="bg-border mt-1 w-px flex-1" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {formatDateYYYYMMDD_HHMM(entry.datetime, '—')}
                    </span>
                    <span className="text-xs font-medium">{entry.operator}</span>
                    {!isSystem && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        メモ
                      </Badge>
                    )}
                    {!isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive ml-auto h-6 shrink-0 px-2 text-xs opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteMemo(entry.id)}
                        disabled={deletingMemoId === entry.id || deleteMemoMutation.isPending}
                      >
                        <Trash2 className="size-3" />
                        削除
                      </Button>
                    )}
                  </div>
                  <p className="text-sm wrap-break-word">{entry.content}</p>
                </div>
              </div>
            );
          })}
        </div>
        <Separator />
        <div className="bg-muted/30 flex flex-col gap-2 rounded-lg p-4">
          <Label className="text-muted-foreground text-xs font-medium">メモを追加</Label>
          <p className="text-muted-foreground text-[11px]">
            システム記録・操作ログは削除できません。追加したメモのみ後から削除できます。
          </p>
          <Textarea
            placeholder="メモを入力してください..."
            rows={3}
            maxLength={TEXTAREA_MAX_LENGTH}
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            disabled={addMemoMutation.isPending}
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleAddMemo}
              disabled={!memoText.trim() || addMemoMutation.isPending}
            >
              {addMemoMutation.isPending ? '追加中...' : '追加'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
