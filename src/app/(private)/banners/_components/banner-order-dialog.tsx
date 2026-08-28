'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import {
  getCrmBannersQueryKey,
  patchCrmBannersDisplayOrderMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { BannerItemResponse } from '@/lib/api/types.gen';

import { BannerThumbnail } from './banner-thumbnail';

interface DraftItem {
  id: string;
  title: string;
  imageUrl: string | null;
  order: string;
  originalOrder: number;
}

interface BannerOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banners: BannerItemResponse[];
}

function OrderDialogContent({
  banners,
  onClose,
}: {
  banners: BannerItemResponse[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [draftItems, setDraftItems] = useState<DraftItem[]>(() =>
    banners.map((b) => ({
      id: b.id,
      title: b.title,
      imageUrl: b.imageUrl,
      order: String(b.order),
      originalOrder: b.order,
    })),
  );

  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    setDraftItems((prev) => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, i) => ({ ...item, order: String(i + 1) }));
    });
  }, []);

  const handleOrderInputChange = useCallback((index: number, value: string) => {
    setDraftItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, order: value } : item)),
    );
  }, []);

  const hasChanges = useMemo(
    () => draftItems.some((item) => String(item.originalOrder) !== item.order),
    [draftItems],
  );

  const reorderMutation = useMutation({
    ...patchCrmBannersDisplayOrderMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'バナーの並び順を更新しました');
      queryClient.invalidateQueries({ queryKey: getCrmBannersQueryKey() });
      onClose();
    },
    onError: () => {
      toast.error('並び順の更新に失敗しました');
    },
  });

  const handleSave = useCallback(() => {
    const items = draftItems.map((item) => ({
      id: item.id,
      order: Math.max(1, Number(item.order) || item.originalOrder),
    }));
    reorderMutation.mutate({ body: { banners: items } });
  }, [draftItems, reorderMutation]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ListOrdered className="size-4" />
          バナー並び順の管理
        </DialogTitle>
      </DialogHeader>

      <p className="text-muted-foreground -mt-2 text-xs">
        「↑」「↓」ボタンまたは番号を直接入力して並び順を変更できます。保存後に反映されます。
      </p>

      <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
        <div className="space-y-2 py-2">
          {draftItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-card flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <Input
                type="number"
                min={1}
                max={draftItems.length}
                value={item.order}
                onChange={(e) => handleOrderInputChange(index, e.target.value)}
                className="h-8 w-14 shrink-0 text-center text-xs"
              />

              <BannerThumbnail
                src={item.imageUrl}
                alt={item.title}
                width={72}
                height={36}
                className="shrink-0"
              />

              <span className="flex-1 truncate text-sm font-medium">{item.title}</span>

              <div className="flex shrink-0 flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => moveItem(index, 'up')}
                >
                  <ArrowUp className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6"
                  disabled={index === draftItems.length - 1}
                  onClick={() => moveItem(index, 'down')}
                >
                  <ArrowDown className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || reorderMutation.isPending}>
          {reorderMutation.isPending ? '保存中...' : '保存する'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function BannerOrderDialog({ open, onOpenChange, banners }: BannerOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-140">
        {banners.length > 0 ? (
          <OrderDialogContent banners={banners} onClose={() => onOpenChange(false)} />
        ) : (
          <div className="flex min-h-40 items-center justify-center">
            <p className="text-muted-foreground text-sm">読み込み中...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
