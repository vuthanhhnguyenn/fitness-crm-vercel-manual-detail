'use client';

import { Unlock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReleaseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSlots: string[];
  onConfirm: () => void;
  isPending?: boolean;
}

export function ReleaseConfirmDialog({
  open,
  onOpenChange,
  targetSlots,
  onConfirm,
  isPending = false,
}: ReleaseConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>スロット開放確認</DialogTitle>
          <DialogDescription>
            選択したスロットを清掃完了として「利用可」に変更します。
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted/30 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground mb-2 text-xs">
            開放対象スロット（{targetSlots.length}件）
          </p>
          <div className="flex flex-wrap gap-1">
            {targetSlots.map((id) => (
              <Badge
                key={id}
                variant="outline"
                className="bg-warning/10 text-warning border-warning/20 text-xs"
              >
                {id}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          スロット状態を「開放待ち」→「利用可」に変更し、紐づく会員情報（会員番号・会員名・解約日）をクリアします。
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            キャンセル
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            <Unlock className="mr-1 size-4" />
            {isPending ? '開放中...' : '開放する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
