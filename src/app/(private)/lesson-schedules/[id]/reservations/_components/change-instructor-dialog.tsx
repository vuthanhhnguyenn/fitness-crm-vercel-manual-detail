'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCircle, Info, X } from 'lucide-react';
import { toast } from 'sonner';

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
  patchCrmLessonSchedulesByScheduleIdInstructorChangeMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { LessonScheduleListItem } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

// Mock instructor list (in a real app, this would come from an API)
const AVAILABLE_INSTRUCTORS = [
  { id: 'inst-1', name: '田中 美咲', specialty: 'ヨガ / ピラティス' },
  { id: 'inst-2', name: '鈴木 健太', specialty: 'ヨガ / ストレッチ' },
  { id: 'inst-3', name: '山本 裕子', specialty: 'ヨガ / 瞑想' },
  { id: 'inst-4', name: '佐藤 あかり', specialty: 'ヨガ全般' },
  { id: 'inst-5', name: '伊藤 大輔', specialty: 'パワーヨガ / HIIT' },
  { id: 'inst-6', name: '渡辺 麻衣', specialty: 'リラックスヨガ / アロマ' },
  { id: 'inst-7', name: '高橋 誠', specialty: 'ボディコンバット / 筋トレ' },
  { id: 'inst-8', name: '小林 真理', specialty: 'ピラティス / バレトン' },
];

interface ChangeInstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  schedule: LessonScheduleListItem;
}

export function ChangeInstructorDialog({
  open,
  onOpenChange,
  scheduleId,
  schedule,
}: ChangeInstructorDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const queryClient = useQueryClient();

  const changeMutation = useMutation({
    ...patchCrmLessonSchedulesByScheduleIdInstructorChangeMutation(),
    onSuccess: () => {
      toast.success('講師を変更しました');
      queryClient.invalidateQueries({ queryKey: getCrmLessonSchedulesQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('講師の変更に失敗しました');
    },
  });

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleRemove = (id: string) => {
    setSelectedIds((prev) => prev.filter((v) => v !== id));
  };

  const handleClose = () => {
    setSelectedIds([]);
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0 || !reason.trim()) return;
    changeMutation.mutate({
      path: { scheduleId },
      body: {
        instructor_ids: selectedIds,
        reason: reason.trim(),
        send_notification: sendNotification,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">講師を変更する</DialogTitle>
          <p className="text-muted-foreground text-xs">{schedule.lesson_name}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current instructor */}
          <div>
            <Label className="mb-2 block text-xs font-medium">現在の講師</Label>
            <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
              <div className="bg-muted flex size-8 items-center justify-center rounded-full text-sm font-medium">
                {schedule.instructor_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{schedule.instructor_name}</p>
              </div>
            </div>
          </div>

          {/* New instructors */}
          <div>
            <Label className="mb-2 block text-xs font-medium">変更先の講師（複数可）</Label>
            <Command className="rounded-lg border">
              <CommandInput placeholder="講師名・専門で検索..." className="h-9 text-sm" />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>該当する講師が見つかりません</CommandEmpty>
                <CommandGroup>
                  {AVAILABLE_INSTRUCTORS.map((inst) => (
                    <CommandItem
                      key={inst.id}
                      value={`${inst.name} ${inst.specialty}`}
                      onSelect={() => handleToggle(inst.id)}
                      className="flex items-center gap-3 py-2"
                    >
                      <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                        {inst.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{inst.name}</p>
                        <p className="text-muted-foreground text-[10px]">{inst.specialty}</p>
                      </div>
                      <Check
                        className={cn(
                          'text-primary size-4 shrink-0',
                          selectedIds.includes(inst.id) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            {selectedIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedIds.map((id) => {
                  const inst = AVAILABLE_INSTRUCTORS.find((i) => i.id === id);
                  if (!inst) return null;
                  return (
                    <span
                      key={id}
                      className="bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-full py-1 pr-2 pl-2 text-xs font-medium"
                    >
                      {inst.name}
                      <button
                        type="button"
                        onClick={() => handleRemove(id)}
                        className="hover:bg-muted-foreground/20 ml-0.5 rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notification */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={sendNotification}
              onCheckedChange={(v) => setSendNotification(!!v)}
            />
            予約者に講師変更を通知する
          </label>

          {/* Reason */}
          <div>
            <p className="mb-1 text-xs font-bold">
              変更理由 <span className="text-destructive">*</span>
            </p>
            <Textarea
              placeholder="変更理由を入力してください（例: インストラクター体調不良のため代行）"
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
                  予約者への通知: <strong className="text-foreground">講師変更のお知らせ</strong>
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
            disabled={selectedIds.length === 0 || !reason.trim() || changeMutation.isPending}
            onClick={handleConfirm}
          >
            講師を変更する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
