'use client';
import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmTermsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmTermsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { TermsDeleteDialog } from '../_components/terms-delete-dialog';
import { TERMS_STATUS_LABELS } from '../_constants/constants';
import { BasicInfoTermDetail } from './_components/basic-info';
import { HistoryTabTermDetail } from './_components/history-tab';

function getStatusBadgeClass(status: GetCrmTermsByIdResponse['status']) {
  switch (status) {
    case 'published':
      return 'bg-success/15 text-success border-success/20';
    case 'expired':
      return 'border-border bg-muted text-muted-foreground';
    case 'draft':
      return 'bg-warning/15 text-warning border-warning/20';
  }
}

export default function TermsDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('info');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const termId = params.id as string;
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmTermsByIdOptions({
      path: {
        id: termId,
      },
    }),
  });

  if (isLoading) {
    return <DataStateBoundary isLoading isEmpty={false} />;
  }

  if (isError || !data) {
    return (
      <DataStateBoundary
        isLoading={false}
        isEmpty={!data}
        isError={isError}
        onRetry={() => {
          void refetch();
        }}
        emptyTitle="規約が見つかりません"
      />
    );
  }

  const detail: GetCrmTermsByIdResponse = data;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="規約文書管理に戻る" href={navigate('/terms')} />}
        title={detail.title}
        badge={
          <Badge
            variant="outline"
            className={`gap-1 text-xs ${getStatusBadgeClass(detail.status)}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {TERMS_STATUS_LABELS[detail.status]}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.TermsEdit}
              className="gap-1"
              onClick={() => {
                router.push(navigate('/terms/[id]/edit', termId));
              }}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger className="border-input hover:bg-accent flex size-8 items-center justify-center rounded-md border">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RoleGatedMenuItem
                  requiredPermission={Permission.TermsDelete}
                  className="text-destructive"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
      <TermsDeleteDialog
        termId={detail.id}
        termName={detail.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          router.push(navigate('/terms'));
        }}
      />
      <div className="bg-background flex-1 overflow-auto px-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList variant="line" className="gap-2">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="versions">バージョン履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <BasicInfoTermDetail detail={detail} />
          </TabsContent>

          <TabsContent value="versions">
            <HistoryTabTermDetail
              versions={detail.versions}
              onCreateVersion={() => {
                router.push(navigate('/terms/create', { mode: 'new-version', sourceId: termId }));
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
