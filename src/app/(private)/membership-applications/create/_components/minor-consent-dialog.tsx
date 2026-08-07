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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MinorConsentDialogProps {
  readonly open: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function MinorConsentDialog({ open, onConfirm, onCancel }: MinorConsentDialogProps) {
  const [checked, setChecked] = useState(false);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>保護者同意の確認</AlertDialogTitle>
          <AlertDialogDescription>
            申請者は未成年です。保護者の同意を得た上で申し込みます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2 py-2">
          <Checkbox id="minor-consent" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
          <Label htmlFor="minor-consent">保護者の同意を得た上で申し込みます</Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={!checked}>
            確認
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
