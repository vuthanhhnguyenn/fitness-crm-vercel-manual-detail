import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: any;
  totalFee: number;
  onConfirm: () => void;
}

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`;
}

export function ApproveDialog({
  open,
  onOpenChange,
  app,
  totalFee,
  onConfirm,
}: Readonly<ApproveDialogProps>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>入会申請を承認しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            承認すると会員登録が完了し、契約完了通知が送信されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">申請者</span>
            <span className="font-medium">{app.applicant_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">店舗</span>
            <span>{app.store_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">プラン</span>
            <span>{app.plan_name}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">初期費用合計</span>
            <span className="font-medium">{formatPrice(totalFee)}</span>
          </div>
        </div>
        {app.blacklist_match && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="text-destructive size-4" />
            <AlertDescription className="text-destructive text-sm">
              この申請にはブラックリスト一致があります。
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>承認する</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
