'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCircle, Info, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmLessonSchedulesQueryKey,
  patchCrmLessonSchedulesByScheduleIdStudioChangeMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem } from '@/lib/api/types.gen';

// Mock studio list (in a real app, this would come from an API)
const AVAILABLE_STUDIOS = [
  { id: 'studio-a', name: 'スタジオA', capacity: 20 },
  { id: 'studio-b', name: 'ヨガスタジオ', capacity: 20 },
  { id: 'studio-c', name: 'マルチスタジオ', capacity: 30 },
  { id: 'studio-d', name: 'ダンススタジオ', capacity: 24 },
  { id: 'studio-e', name: 'パーソナルブースA', capacity: 2 },
  { id: 'studio-f', name: 'パーソナルブースB', capacity: 2 },
];

interface ChangeStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  schedule: LessonScheduleListItem;
}

export function ChangeStudioDialog({
  open,
  onOpenChange,
  scheduleId,
  schedule,
}: ChangeStudioDialogProps) {
  const [selectedStudioId, setSelectedStudioId] = useState('');
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const queryClient = useQueryClient();

  const changeMutation = useMutation({
    ...patchCrmLessonSchedulesByScheduleIdStudioChangeMutation(),
    onSuccess: () => {
      toast.success('スタジオを変更しました');
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('スタジオの変更に失敗しました');
    },
  });

  const handleClose = () => {
    setSelectedStudioId('');
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!selectedStudioId || !reason.trim()) return;
    changeMutation.mutate({
      path: { scheduleId },
      body: {
        studio_id: selectedStudioId,
        reason: reason.trim(),
        send_notification: sendNotification,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">スタジオを変更する</DialogTitle>
          <p className="text-muted-foreground text-xs">{schedule.lesson_name}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current studio */}
          <div>
            <Label className="mb-2 block text-xs font-medium">現在のスタジオ</Label>
            <div className="bg-muted/50 rounded-lg p-3 text-sm font-medium">
              {schedule.studio_name ?? '未設定'}（定員{schedule.capacity}名）
            </div>
          </div>

          {/* New studio */}
          <div>
            <Label className="mb-2 block text-xs font-medium">変更先のスタジオ</Label>
            <Command className="rounded-lg border">
              <CommandInput placeholder="スタジオ名で検索..." className="h-9 text-sm" />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>該当するスタジオが見つかりません</CommandEmpty>
                <CommandGroup>
                  {AVAILABLE_STUDIOS.map((studio) => (
                    <CommandItem
                      key={studio.id}
                      value={studio.name}
                      onSelect={() => setSelectedStudioId(studio.id)}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="text-muted-foreground size-4 shrink-0" />
                        <span className="text-sm font-medium">{studio.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          定員{studio.capacity}名
                        </Badge>
                        {selectedStudioId === studio.id && (
                          <Check className="text-primary size-4 shrink-0" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          {/* Layout change warning */}
          <div className="bg-info/10 border-info/20 rounded-lg border p-3">
            <p className="text-info text-xs">
              スタジオ変更に伴いスペースレイアウトが変わる場合があります。変更後にスペース予約状況を確認してください。
            </p>
          </div>

          {/* Notification */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={sendNotification}
              onCheckedChange={(v) => setSendNotification(!!v)}
            />
            予約者にスタジオ変更を通知する（{schedule.booked_count}名）
          </label>

          {/* Reason */}
          <div>
            <p className="mb-1 text-xs font-bold">
              変更理由 <span className="text-destructive">*</span>
            </p>
            <Textarea
              placeholder="変更理由を入力してください（例: 設備点検のためスタジオ変更）"
              className="resize-none text-sm"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Impact summary */}
          <div className="bg-muted/50 rounded-lg border p-4">
            <h4 className="mb-2 text-xs font-bold">変更の影響</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Info className="text-info size-4 shrink-0" />
                <span className="text-muted-foreground">
                  影響を受ける予約:{' '}
                  <strong className="text-foreground">{schedule.booked_count}件</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="text-warning size-4 shrink-0" />
                <span className="text-muted-foreground">
                  予約者への通知:{' '}
                  <strong className="text-foreground">スタジオ変更のお知らせ</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-success size-4 shrink-0" />
                <span className="text-muted-foreground">
                  返金処理: <strong className="text-foreground">不要</strong>（レッスン自体は実施）
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            size="sm"
            disabled={!selectedStudioId || !reason.trim() || changeMutation.isPending}
            onClick={handleConfirm}
          >
            スタジオを変更する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
