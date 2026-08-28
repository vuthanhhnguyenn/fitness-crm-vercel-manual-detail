'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { type ReactNode, useState } from 'react';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
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

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { RejectionReason } from '@/lib/api';
import {
  getCrmMembersOptions,
  getCrmMembershipApplicationsByIdOptions,
  getCrmMembershipApplicationsOptions,
  postCrmMembershipApplicationsByIdApproveMutation,
  postCrmMembershipApplicationsByIdRejectMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { Permission, UserRole } from '@/types/permission.type';

import { REJECTION_REASON_LABELS, SAME_DAY_CANCEL_LIMIT } from '../../_constants/constants';
import { ApprovalChecklistCard } from './approval-checklist-card';
import { ApproveDialog } from './approve-dialog';
import {
  type ApplicationDetail,
  getStatusBadge,
  getStatusLabel,
  isAgreementMissing,
} from './membership-application.utils';
import { RejectDialog } from './reject-dialog';

interface StatusActionCardProps {
  app: ApplicationDetail;
  applicationId: string;
  staffExemptionReason: string;
  onStaffExemptionReasonChange: (reason: string) => void;
}

function getStatusVisual(status: ApplicationDetail['status']): {
  icon: ReactNode;
  bgClass: string;
} {
  switch (status) {
    case 'pending':
      return { icon: <Clock className="text-warning size-8" />, bgClass: 'bg-warning/15' };
    case 'review':
      return { icon: <ClipboardCheck className="text-info size-8" />, bgClass: 'bg-info/15' };
    case 'approved':
    case 'auto_approved':
      return { icon: <CheckCircle className="text-success size-8" />, bgClass: 'bg-success/15' };
    case 'rejected':
      return {
        icon: <XCircle className="text-destructive size-8" />,
        bgClass: 'bg-destructive/15',
      };
    case 'cancelled':
      return { icon: <Archive className="text-muted-foreground size-8" />, bgClass: 'bg-muted' };
  }
}

export function StatusActionCard({
  app,
  applicationId,
  staffExemptionReason,
  onStaffExemptionReasonChange,
}: Readonly<StatusActionCardProps>) {
  const queryClient = useQueryClient();
  const status = app.status;

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectionReason | ''>('');
  const [rejectSupplement, setRejectSupplement] = useState('');

  function invalidateApplication() {
    queryClient.invalidateQueries(
      getCrmMembershipApplicationsByIdOptions({ path: { id: applicationId } }),
    );
    queryClient.invalidateQueries({
      queryKey: getCrmMembershipApplicationsOptions().queryKey,
    });
  }

  const approveMutation = useMutation({
    ...postCrmMembershipApplicationsByIdApproveMutation(),
    onSuccess: () => {
      setApproveDialogOpen(false);
      onStaffExemptionReasonChange('');
      invalidateApplication();
      queryClient.invalidateQueries({
        queryKey: getCrmMembersOptions().queryKey,
      });
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
      setRejectSupplement('');
      invalidateApplication();
      toast.success('入会申請を否認しました。');
    },
    onError: () => {
      toast.error('否認処理に失敗しました。');
    },
  });

  function handleApproveConfirm() {
    approveMutation.mutate({
      path: { id: applicationId },
      body: staffExemptionReason.trim()
        ? { staff_exemption_reason: staffExemptionReason.trim() }
        : {},
    });
  }

  function handleRejectConfirm() {
    if (!rejectReason) return;
    rejectMutation.mutate({
      path: { id: applicationId },
      body: {
        rejection_reason: rejectReason,
        rejection_supplement: rejectSupplement.trim() || undefined,
      },
    });
  }

  const { icon, bgClass } = getStatusVisual(status);
  const agreementMissing = isAgreementMissing(app);

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
          <p className="text-muted-foreground text-xs">
            最終更新: {formatDateYYYYMMDD_HHMM(app.updated_at, '—')}
          </p>

          {(status === 'approved' || status === 'auto_approved') &&
            app.approved_by &&
            app.approved_at && (
              <div className="text-muted-foreground bg-success/10 flex w-full flex-col gap-1 rounded-md px-3 py-2 text-xs">
                <span>
                  <span className="font-medium">承認者:</span> {app.approved_by}
                </span>
                <span>
                  <span className="font-medium">承認日時:</span>{' '}
                  {formatDateYYYYMMDD_HHMM(app.approved_at, '—')}
                </span>
              </div>
            )}

          {(status === 'approved' ||
            status === 'auto_approved' ||
            app.same_day_cancel_count > 0) && (
            <div className="flex w-full items-center justify-between px-1 text-xs">
              <span className="text-muted-foreground">当日取り消し回数</span>
              <span
                className={`font-medium tabular-nums ${app.same_day_cancel_count >= SAME_DAY_CANCEL_LIMIT ? 'text-destructive' : ''}`}
              >
                {app.same_day_cancel_count} / {SAME_DAY_CANCEL_LIMIT}
              </span>
            </div>
          )}

          {status === 'rejected' && app.rejected_by && app.rejected_at && (
            <div className="text-muted-foreground bg-destructive/10 flex w-full flex-col gap-1 rounded-md px-3 py-2 text-xs">
              <span>
                <span className="font-medium">否認者:</span> {app.rejected_by}
              </span>
              <span>
                <span className="font-medium">否認日時:</span>{' '}
                {formatDateYYYYMMDD_HHMM(app.rejected_at, '—')}
              </span>
              {app.rejection_reason && (
                <span>
                  <span className="font-medium">否認理由:</span>{' '}
                  {REJECTION_REASON_LABELS[app.rejection_reason]}
                  {app.rejection_supplement ? `。${app.rejection_supplement}` : ''}
                </span>
              )}
            </div>
          )}

          {status === 'pending' && <ApprovalChecklistCard app={app} />}

          {status === 'pending' && (
            <>
              <Separator className="w-full" />
              <div className="flex w-full flex-col gap-2">
                {app.blacklist_state === 'matched' && (
                  <Alert className="border-destructive/50 bg-destructive/10 py-2">
                    <AlertTriangle className="text-destructive size-4" />
                    <AlertDescription className="text-destructive text-xs">
                      BL一致あり。慎重に審査してください。
                    </AlertDescription>
                  </Alert>
                )}
                {agreementMissing && (
                  <Alert className="border-destructive/50 bg-destructive/10 py-2">
                    <AlertTriangle className="text-destructive size-4" />
                    <AlertDescription className="text-destructive text-xs">
                      代理申請の合意日時が未入力です。合意日時の入力は必須のため、承認操作をブロックしています。
                    </AlertDescription>
                  </Alert>
                )}
                <RoleGatedButton
                  allowedRoles={[UserRole.Headquarter, UserRole.Manager, UserRole.Staff]}
                  requiredPermission={Permission.MembershipApplicationsApprove}
                  denyTooltip="入会申請承認の権限がありません"
                  variant={app.blacklist_state === 'matched' ? 'outline' : 'default'}
                  fullWidth
                  className={cn('gap-2', agreementMissing && 'disabled:opacity-100')}
                  disabled={agreementMissing}
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <Check className="size-4" />
                  {app.blacklist_state === 'matched' ? 'リスクを確認して承認する' : '承認する'}
                </RoleGatedButton>
                <RoleGatedButton
                  allowedRoles={[UserRole.Headquarter, UserRole.Manager, UserRole.Staff]}
                  requiredPermission={Permission.MembershipApplicationsApprove}
                  denyTooltip="入会申請否認の権限がありません"
                  variant="outline"
                  fullWidth
                  className="text-destructive hover:text-destructive gap-2"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <X className="size-4" />
                  否認する
                </RoleGatedButton>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        app={app}
        staffExemptionReason={staffExemptionReason}
        onConfirm={handleApproveConfirm}
      />

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        paymentMethod={app.payment_method}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        rejectSupplement={rejectSupplement}
        onRejectSupplementChange={setRejectSupplement}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
