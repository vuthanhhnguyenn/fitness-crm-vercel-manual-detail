'use client';

import { useState } from 'react';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { PromoCodesTabHook } from '../_hooks/use-promo-codes-tab';

/**
 * G-06 FR-007 途中無効化。
 * 要件 L269「無効化の操作履歴（操作者・日時）を記録する」に基づき理由入力を必須にする。
 */
export function PromoCodeDisableDialog({ tab }: Readonly<{ tab: PromoCodesTabHook }>) {
  const [reason, setReason] = useState('');
  const target = tab.disableTarget;

  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          tab.setDisableTarget(null);
          setReason('');
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このプロモーションコードを無効化しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            無効化後は該当コードを入力した会員に「無効なコードです」エラーが表示されます。操作履歴（操作者・日時・理由）を記録します。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {target && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-xs">対象コード</Label>
              <code className="bg-muted w-fit rounded px-2 py-1 font-mono text-sm">
                {target.code}
              </code>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="disable-reason" className="text-muted-foreground text-xs">
                無効化理由（操作履歴に記録）
              </Label>
              <Textarea
                id="disable-reason"
                rows={3}
                placeholder="例: 想定上限を超過したため早期終了"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={tab.isDisabling}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => tab.disableCode(reason)}
            disabled={!reason.trim() || tab.isDisabling}
          >
            無効化する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
