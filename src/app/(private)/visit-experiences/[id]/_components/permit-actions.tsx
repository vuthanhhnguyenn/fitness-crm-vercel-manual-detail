'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, DoorOpen, Loader2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  getCrmVisitExperiencesByIdQueryKey,
  postCrmVisitExperiencesByIdPermitMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import type { VisitExperienceDetail } from '@/types/api/visit-experience.type';
import { UserRole } from '@/types/permission.type';

interface PermitActionsProps {
  record: VisitExperienceDetail;
}

function PermitDialog({
  open,
  onOpenChange,
  onConfirm,
  record,
  isBLRisk,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  record: VisitExperienceDetail;
  isBLRisk: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBLRisk ? '⚠ BL一致 — 入館許可を発行しますか？' : '見学を許可しますか？'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBLRisk &&
              `このお客様はブラックリストに一致しています（${record.bl_match_reason}）。`}
            {record.customer_name}（{record.customer_name_kana}
            ）に30分間の時間制限入館を発行します。B-01
            入退館管理と連携し、顔認証でメインエントランスからの入館が有効になります。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            className={isBLRisk ? 'bg-destructive hover:bg-destructive/90' : undefined}
            onClick={onConfirm}
          >
            見学を許可する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PermitActions({ record }: PermitActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate: permit, isPending } = useMutation({
    ...postCrmVisitExperiencesByIdPermitMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getCrmVisitExperiencesByIdQueryKey({ path: { id: record.id } }),
      });
    },
  });

  const handlePermit = () => {
    setDialogOpen(false);
    permit(
      { path: { id: record.id } },
      {
        onSuccess: () => {
          toast.success('見学許可を発行しました');
        },
        onError: (error) => {
          const message =
            error && typeof error === 'object' && 'reason' in error
              ? String((error as { reason?: string }).reason)
              : '許可の発行に失敗しました';
          toast.error(message);
        },
      },
    );
  };

  const handleEnrollment = () => {
    router.push(
      navigate('/membership-applications/create', {
        customer_name: record.customer_name,
        customer_name_kana: record.customer_name_kana,
        birth_date: record.birth_date,
        phone: record.phone ?? undefined,
        email: record.email ?? undefined,
        visit_experience_id: record.id,
      }),
    );
  };

  // default: all checks pass — show all-clear + permit button
  if (record.status === 'application_received') {
    return (
      <div className="flex w-full flex-col gap-2">
        <Alert className="border-success/50 bg-success/10 w-full py-2">
          <CheckCircle2 className="text-success size-4" />
          <AlertDescription className="text-success text-xs">
            個人情報・顔写真・BL照合 すべてOK
          </AlertDescription>
        </Alert>
        <RoleGatedButton
          allowedRoles={[UserRole.System, UserRole.Headquarter, UserRole.Manager, UserRole.Staff]}
          variant="default"
          className="w-full gap-2"
          disabled={isPending}
          onClick={() => setDialogOpen(true)}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <DoorOpen className="size-4" />
          )}
          見学を許可する（30分）
        </RoleGatedButton>
        <p className="text-muted-foreground text-center text-xs">
          B-01 入退館管理に時間制限入館を発行します
        </p>
        <PermitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConfirm={handlePermit}
          record={record}
          isBLRisk={false}
        />
      </div>
    );
  }

  // info-missing: blocking — list missing items + disabled button
  if (record.status === 'info_missing') {
    return (
      <div className="flex w-full flex-col gap-2">
        <Alert className="border-destructive/50 bg-destructive/10 w-full py-2">
          <AlertTriangle className="text-destructive size-4" />
          <AlertDescription className="text-destructive text-xs">
            個人情報または顔写真が未登録のため見学不可
          </AlertDescription>
        </Alert>
        <ul className="text-destructive flex w-full flex-col gap-1 pl-4 text-xs">
          {!record.phone && <li className="list-disc">電話番号が未登録</li>}
          {!record.address && <li className="list-disc">住所が未登録</li>}
          {!record.id_document_verified && <li className="list-disc">顔写真が未登録</li>}
        </ul>
        <Button className="w-full gap-2" disabled>
          <DoorOpen className="size-4" />
          見学を許可する（30分）
        </Button>
      </div>
    );
  }

  // bl-match: risk-override permit button
  if (record.status === 'bl_checking') {
    return (
      <div className="flex w-full flex-col gap-2">
        {record.bl_match && (
          <>
            <Alert className="border-destructive/50 bg-destructive/10 w-full py-2">
              <AlertTriangle className="text-destructive size-4" />
              <AlertDescription className="text-destructive text-xs">
                ブラックリスト一致あり — 慎重に判断してください
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground w-full text-xs">
              一致理由: {record.bl_match_reason}
            </p>
          </>
        )}
        <RoleGatedButton
          allowedRoles={[UserRole.System, UserRole.Headquarter, UserRole.Manager, UserRole.Staff]}
          variant="outline"
          className={`w-full gap-2 ${record.bl_match ? 'text-destructive hover:text-destructive' : ''}`}
          disabled={isPending}
          onClick={() => setDialogOpen(true)}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <DoorOpen className="size-4" />
          )}
          {record.bl_match ? 'リスクを確認して見学を許可する（30分）' : '見学を許可する（30分）'}
        </RoleGatedButton>
        <PermitDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConfirm={handlePermit}
          record={record}
          isBLRisk={record.bl_match}
        />
      </div>
    );
  }

  // visiting: B-01 status badge (no action buttons)
  if (record.status === 'visiting') {
    return (
      <div className="flex w-full items-center justify-between text-xs">
        <span className="text-muted-foreground">B-01 連携状況</span>
        <Badge variant="outline" className="border-info/20 bg-info/15 text-info text-[10px]">
          時間制限入館 有効
        </Badge>
      </div>
    );
  }

  // visit_completed: show end datetime + membership guidance button
  if (record.status === 'visit_completed') {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="text-muted-foreground w-full py-1 text-center text-xs">
          見学終了済み（
          {record.visit_end_actual_at
            ? new Date(record.visit_end_actual_at).toLocaleString('ja-JP', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
          ）
        </div>
        <RoleGatedButton
          allowedRoles={[UserRole.System, UserRole.Headquarter, UserRole.Manager, UserRole.Staff]}
          variant="default"
          className="w-full gap-2"
          onClick={handleEnrollment}
        >
          <UserCheck className="size-4" />
          入会申請へ誘導
        </RoleGatedButton>
        <p className="text-muted-foreground text-center text-xs">
          入会申請フォームへ氏名等がプリセットされます
        </p>
      </div>
    );
  }

  return null;
}
