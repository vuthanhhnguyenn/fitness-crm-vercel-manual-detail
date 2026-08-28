import { formatYen } from '@/utils/format.util';
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

import {
  type ApplicationDetail,
  EXEMPTION_KIND_LABELS,
  previewExemption,
} from './membership-application.utils';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: ApplicationDetail;
  staffExemptionReason: string;
  onConfirm: () => void;
}

export function ApproveDialog({
  open,
  onOpenChange,
  app,
  staffExemptionReason,
  onConfirm,
}: Readonly<ApproveDialogProps>) {
  const preview = previewExemption(app.enrollment_fee_exemption, staffExemptionReason);
  const enrollmentFeeRow = app.fee_rows.find((r) => r.key === 'enrollment_fee');
  const rowsTotal = app.fee_rows.reduce((sum, r) => sum + r.amount, 0);
  const hasExemption = Boolean(preview) && (preview?.discountAmount ?? 0) > 0 && enrollmentFeeRow;
  const total = hasExemption ? rowsTotal - (preview?.discountAmount ?? 0) : rowsTotal;

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
          {hasExemption && enrollmentFeeRow && preview && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">入会金（定価）</span>
                <span className="text-muted-foreground line-through">
                  {formatYen(enrollmentFeeRow.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-success">
                  入会金免除（{EXEMPTION_KIND_LABELS[preview.kind]}）
                </span>
                <span className="text-success font-medium">
                  -{formatYen(preview.discountAmount)}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">初期費用合計</span>
            <span className="font-medium">{formatYen(total)}</span>
          </div>
          <p className="text-muted-foreground text-xs">
            確定金額は承認時に初回請求（売上管理）へ反映されます。
          </p>
        </div>
        {app.blacklist_state === 'matched' && (
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
