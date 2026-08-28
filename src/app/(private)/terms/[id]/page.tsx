'use client';

import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { TermsDeleteDialog } from '@/app/(private)/terms/_components/terms-delete-dialog';
import { TermsDetailSkeleton } from '@/app/(private)/terms/_components/terms-detail/terms-detail-skeleton';
import { TermsDetailTabs } from '@/app/(private)/terms/_components/terms-detail/terms-detail-tabs';
import {
  TERMS_STATUS_BADGE_CLASSES,
  TERMS_STATUS_LABELS,
} from '@/app/(private)/terms/_constants/constants';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { getCrmTermsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { UserRole } from '@/types/permission.type';

export default function TermsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const termsId = params.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: terms,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...getCrmTermsByIdOptions({ path: { id: termsId } }),
    enabled: Boolean(termsId),
  });

  if (!terms) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && !isError}
        onRetry={() => void refetch()}
        emptyTitle="規約文書が見つかりません"
        emptyDescription={`指定された規約ID（${termsId}）は存在しないか、参照権限がありません。`}
        skeleton={<TermsDetailSkeleton />}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        breadcrumb={<BackLink label="規約文書管理に戻る" href={navigate('/terms')} />}
        title={terms.title}
        badge={
          <Badge
            variant="outline"
            className={cn(
              'gap-1 text-[10px] font-medium',
              TERMS_STATUS_BADGE_CLASSES[terms.status],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {TERMS_STATUS_LABELS[terms.status]}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              allowedRoles={[UserRole.Headquarter, UserRole.System]}
              className="gap-1"
              onClick={() => router.push(navigate('/terms/[id]/edit', termsId))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RoleGatedMenuItem
                  allowedRoles={[UserRole.Headquarter, UserRole.System]}
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="px-6 py-4">
        <TermsDetailTabs terms={terms} />
      </div>

      <TermsDeleteDialog
        target={deleteOpen ? { id: terms.id, title: terms.title } : null}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push(navigate('/terms'))}
      />
    </div>
  );
}
