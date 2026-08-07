'use client';

import { type ReactNode, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle,
  ClipboardCheck,
  Clock,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import {
  getCrmMembershipApplicationsByIdOptions,
  postCrmMembershipApplicationsByIdApproveMutation,
  postCrmMembershipApplicationsByIdRejectMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { ApproveDialog } from './approve-dialog';
import { getStatusBadge, getStatusLabel } from './membership-application.utils';
import { RejectDialog } from './reject-dialog';

type ApplicationStatus = 'pending' | 'review' | 'approved' | 'rejected' | 'cancelled';

interface StatusActionCardProps {
  app: any;
  applicationId: string;
}

function getStatusVisual(status: ApplicationStatus): { icon: ReactNode; bgClass: string } {
  switch (status) {
    case 'pending':
      return { icon: <Clock className="text-warning size-8" />, bgClass: 'bg-warning/15' };
    case 'review':
      return {
        icon: <ClipboardCheck className="text-info size-8" />,
        bgClass: 'bg-info/15',
      };
    case 'approved':
      return {
        icon: <CheckCircle className="text-success size-8" />,
        bgClass: 'bg-success/15',
      };
    case 'rejected':
      return {
        icon: <XCircle className="text-destructive size-8" />,
        bgClass: 'bg-destructive/15',
      };
    case 'cancelled':
      return {
        icon: <Archive className="text-muted-foreground size-8" />,
        bgClass: 'bg-muted',
      };
  }
}

export function StatusActionCard({ app, applicationId }: Readonly<StatusActionCardProps>) {
  const queryClient = useQueryClient();
  const status = app.status as ApplicationStatus;

  // Local state for dialogs and form
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const approveMutation = useMutation({
    ...postCrmMembershipApplicationsByIdApproveMutation(),
    onSuccess: () => {
      setApproveDialogOpen(false);
      void queryClient.invalidateQueries(
        getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
      );
      toast.success('入会申請を承認しました。');
    },
    onError: () => {
      toast.error('承認処理に失敗しました。');
    },
  });

  const rejectMutation = useMutation({
    ...postCrmMembershipApplicationsByIdRejectMutation(),
    onSuccess: () => {
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectNote('');
      void queryClient.invalidateQueries(
        getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
      );
      toast.success('入会申請を否認しました。');
    },
    onError: () => {
      toast.error('否認処理に失敗しました。');
    },
  });

  function handleApproveConfirm() {
    approveMutation.mutate({
      path: { id: applicationId },
      body: { approval_reason: '手動承認' },
    });
  }

  function handleRejectConfirm() {
    rejectMutation.mutate({
      path: { id: applicationId },
      body: { rejection_reason: rejectReason, note: rejectNote || undefined },
    });
  }

  const { icon, bgClass } = getStatusVisual(status);
  const minorThreshold = app.brand_name === 'FIT365' ? 16 : 15;
  const isMinor = (app.age ?? 0) < 18;
  const feeRows = app.fee_rows ?? [];
  const totalFee = feeRows.reduce((sum: number, r: any) => sum + r.amount, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ステータス</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 px-4">
          <div className={`flex size-20 items-center justify-center rounded-full ${bgClass}`}>
            {icon}
          </div>
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-medium ${getStatusBadge(status)}`}
          >
            {getStatusLabel(status)}
          </Badge>
          <p className="text-muted-foreground text-xs">最終更新: {app.updated_at ?? '—'}</p>

          {/* 承認後フィードバック */}
          {status === 'approved' && app.approved_by && app.approved_at && (
            <div className="text-muted-foreground bg-success/10 flex w-full flex-col gap-1 rounded-md px-3 py-2 text-xs">
              <span>
                <span className="font-medium">承認者:</span> {app.approved_by}
              </span>
              <span>
                <span className="font-medium">承認日時:</span> {app.approved_at}
              </span>
            </div>
          )}

          {/* 当日取り消し回数（承認済のみ表示） */}
          {status === 'approved' && (
            <div className="flex w-full items-center justify-between px-1 text-xs">
              <span className="text-muted-foreground">当日取り消し回数</span>
              <span className="font-medium tabular-nums">0 / 2</span>
            </div>
          )}

          {/* 否認後フィードバック */}
          {status === 'rejected' && app.rejected_by && app.rejected_at && (
            <div className="text-muted-foreground bg-destructive/10 flex w-full flex-col gap-1 rounded-md px-3 py-2 text-xs">
              <span>
                <span className="font-medium">否認者:</span> {app.rejected_by}
              </span>
              <span>
                <span className="font-medium">否認日時:</span> {app.rejected_at}
              </span>
              {app.rejected_reason && (
                <span>
                  <span className="font-medium">否認理由:</span> {app.rejected_reason}
                </span>
              )}
            </div>
          )}

          {status === 'pending' && (
            <>
              <Separator className="w-full" />
              <div className="flex w-full flex-col gap-2">
                <span className="text-muted-foreground text-xs font-medium">承認前チェック</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-success size-4 shrink-0" />
                    <span className="text-xs">ブラックリスト照合完了</span>
                    {app.blacklist_match && (
                      <Badge
                        variant="outline"
                        className="bg-destructive/15 text-destructive border-destructive/20 ml-auto text-[10px]"
                      >
                        一致あり
                      </Badge>
                    )}
                  </div>
                  {isMinor ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-warning size-4 shrink-0" />
                      <span className="text-warning text-xs">
                        未成年（{app.age}歳 /{' '}
                        {app.brand_name === 'FIT365' ? 'FIT365: 16歳以上' : 'JOYFIT: 15歳以上'}）
                      </span>
                      {app.parental_consent && (
                        <Badge
                          variant="outline"
                          className="bg-success/15 text-success border-success/20 ml-auto text-[10px]"
                        >
                          保護者同意確認済み
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-success size-4 shrink-0" />
                      <span className="text-xs">
                        年齢条件: 成人（{app.age}歳 /{' '}
                        {app.brand_name === 'FIT365'
                          ? 'FIT365: 16歳以上'
                          : `JOYFIT: ${minorThreshold}歳以上`}
                        ）
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-success size-4 shrink-0" />
                    <span className="text-xs">利用開始日: 2ヶ月以内</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {status === 'pending' && (
            <>
              <Separator className="w-full" />
              <div className="flex w-full flex-col gap-2">
                {app.blacklist_match && (
                  <Alert className="border-destructive/50 bg-destructive/10 py-2">
                    <AlertTriangle className="text-destructive size-4" />
                    <AlertDescription className="text-destructive text-xs">
                      BL一致あり。慎重に審査してください。
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  variant={app.blacklist_match ? 'outline' : 'default'}
                  className="w-full gap-2"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <Check className="size-4" />
                  {app.blacklist_match ? 'リスクを確認して承認する' : '承認する'}
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive w-full gap-2"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <X className="size-4" />
                  否認する
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve dialog */}
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        app={app}
        totalFee={totalFee}
        onConfirm={handleApproveConfirm}
      />

      {/* Reject dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        rejectNote={rejectNote}
        onRejectNoteChange={setRejectNote}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
