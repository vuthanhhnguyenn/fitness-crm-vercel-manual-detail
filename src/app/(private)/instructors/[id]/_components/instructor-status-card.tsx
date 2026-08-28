'use client';

import { useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  getCrmInstructorsByIdQueryKey,
  getCrmInstructorsQueryKey,
  patchCrmInstructorsByIdStatusMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { UserRole } from '@/types/permission.type';

interface InstructorStatusCardProps {
  instructorId: string;
  instructorName: string;
  status: 'active' | 'inactive';
}

export function InstructorStatusCard({
  instructorId,
  instructorName,
  status,
}: InstructorStatusCardProps) {
  const queryClient = useQueryClient();
  // Synchronous re-entrancy guard: `disabled={isPending}` only updates on the next
  // render, so rapid clicks in the same tick would otherwise fire duplicate requests.
  const submittingRef = useRef(false);

  const statusMutation = useMutation({
    ...patchCrmInstructorsByIdStatusMutation(),
    onSuccess: (_data, variables) => {
      const nextStatus = variables.body?.status;
      toast.success(
        nextStatus === 'inactive'
          ? `${instructorName}を無効化しました`
          : `${instructorName}を有効化しました`,
      );
      queryClient.invalidateQueries({ queryKey: getCrmInstructorsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmInstructorsByIdQueryKey({ path: { id: instructorId } }),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'ステータスの変更に失敗しました');
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const handleToggle = () => {
    if (submittingRef.current || statusMutation.isPending) return;
    submittingRef.current = true;
    const nextStatus = status === 'active' ? 'inactive' : 'active';
    statusMutation.mutate({
      path: { id: instructorId },
      body: { status: nextStatus },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">ステータス</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            {status === 'active' ? (
              <div className="bg-success/10 flex size-20 items-center justify-center rounded-full">
                <CheckCircle2 className="text-success size-9" />
              </div>
            ) : (
              <div className="bg-muted flex size-20 items-center justify-center rounded-full">
                <Ban className="text-muted-foreground size-9" />
              </div>
            )}
          </div>
          <div className="flex justify-center">
            {status === 'active' ? (
              <Badge
                variant="outline"
                className="bg-success/15 text-success border-success/20 gap-1 text-xs font-medium"
              >
                <span className="bg-success size-1.5 rounded-full" />
                有効
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-border gap-1 text-xs font-medium"
              >
                <span className="bg-muted-foreground size-1.5 rounded-full" />
                無効
              </Badge>
            )}
          </div>
          <RoleGatedButton
            allowedRoles={[UserRole.System, UserRole.Headquarter, UserRole.Manager]}
            denyTooltip="ステータス変更は本部・マネージャーのみ可能です"
            variant="outline"
            size="sm"
            fullWidth
            disabled={statusMutation.isPending}
            className={`gap-1 ${status === 'active' ? 'text-warning hover:text-warning' : 'text-success hover:text-success'}`}
            onClick={handleToggle}
          >
            <Ban className="size-4" />
            {status === 'active' ? '無効化する' : '有効化する'}
          </RoleGatedButton>
        </div>
      </CardContent>
    </Card>
  );
}
