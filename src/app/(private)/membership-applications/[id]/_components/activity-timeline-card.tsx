'use client';

import { useCallback, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
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
  postCrmMembershipApplicationsByIdMemosMutation,
} from '@/lib/api/@tanstack/react-query.gen';

interface TimelineEntry {
  id: string;
  kind: 'system' | 'memo';
  date: string;
  operator: string;
  content: string;
}

interface ActivityTimelineCardProps {
  initialTimeline: TimelineEntry[];
  applicationId: string;
}

export function ActivityTimelineCard({
  initialTimeline,
  applicationId,
}: Readonly<ActivityTimelineCardProps>) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>(initialTimeline);
  const [memoText, setMemoText] = useState('');
  const [deletingMemoId, setDeletingMemoId] = useState<string | null>(null);

  // Mutation for adding memo
  const addMemoMutation = useMutation({
    ...postCrmMembershipApplicationsByIdMemosMutation(),
  });

  // Mutation for deleting memo
  const deleteMemoMutation = useMutation({
    ...deleteCrmMembershipApplicationsByIdMemosByMemoIdMutation(),
  });

  const handleAddMemo = useCallback(async () => {
    if (!memoText.trim()) return;

    try {
      const newMemo = await addMemoMutation.mutateAsync({
        path: { id: applicationId },
        body: { content: memoText.trim() },
      });

      setTimeline([newMemo, ...timeline]);
      setMemoText('');
      toast.success('メモを追加しました');
    } catch (error) {
      console.error('Error adding memo:', error);
      toast.error('メモの追加に失敗しました');
    }
  }, [memoText, timeline, applicationId, addMemoMutation]);

  const handleDeleteMemo = useCallback(
    async (memoId: string) => {
      setDeletingMemoId(memoId);
      try {
        await deleteMemoMutation.mutateAsync({
          path: { id: applicationId, memoId },
        });

        setTimeline(timeline.filter((e) => e.id !== memoId));
        toast.success('メモを削除しました');
      } catch (error) {
        console.error('Error deleting memo:', error);
        toast.error('メモの削除に失敗しました');
      } finally {
        setDeletingMemoId(null);
      }
    },
    [timeline, applicationId, deleteMemoMutation],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">対応履歴・メモ</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4">
        {/* タイムライン */}
        <div className="flex flex-col gap-0">
          {timeline.map((entry, i) => {
            const isSystem = entry.kind === 'system';
            return (
              <div key={entry.id} className="group flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-2 size-2.5 shrink-0 rounded-full ${isSystem ? 'bg-muted-foreground' : 'bg-primary'}`}
                  />
                  {i < timeline.length - 1 && <div className="bg-border mt-1 w-px flex-1" />}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{entry.date}</span>
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
                        className="text-muted-foreground hover:text-destructive ml-auto h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteMemo(entry.id)}
                        disabled={deletingMemoId === entry.id || deleteMemoMutation.isPending}
                      >
                        <Trash2 className="size-3" />
                        削除
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{entry.content}</p>
                </div>
              </div>
            );
          })}
        </div>
        <Separator />
        {/* メモ追加 */}
        <div className="bg-muted/30 flex flex-col gap-2 rounded-lg p-4">
          <Label className="text-muted-foreground text-xs font-medium">メモを追加</Label>
          <p className="text-muted-foreground text-[11px]">
            システム記録・操作ログは削除できません。追加したメモのみ後から削除できます。
          </p>
          <Textarea
            placeholder="メモを入力してください..."
            rows={3}
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
