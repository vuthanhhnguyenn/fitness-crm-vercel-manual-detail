'use client';

import { useRouter } from 'next/navigation';

import { BasicInfoCard } from '@/app/(private)/terms/_components/terms-detail/basic-info-card';
import { ManagementInfoCard } from '@/app/(private)/terms/_components/terms-detail/management-info-card';
import { VersionTimeline } from '@/app/(private)/terms/_components/terms-detail/version-timeline';
import { Plus } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { TermsDetailResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

interface TermsDetailTabsProps {
  terms: TermsDetailResponse;
}

export function TermsDetailTabs({ terms }: Readonly<TermsDetailTabsProps>) {
  const router = useRouter();

  return (
    <Tabs defaultValue="info" className="gap-4">
      <TabsList variant="line">
        <TabsTrigger value="info">基本情報</TabsTrigger>
        <TabsTrigger value="versions">バージョン履歴</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <div className="flex gap-4">
          <div className="flex w-[60%] flex-col gap-4">
            <BasicInfoCard terms={terms} />
          </div>
          <div className="w-[40%]">
            <div className="sticky top-0 flex flex-col gap-4">
              <ManagementInfoCard terms={terms} />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="versions">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">バージョン履歴</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                新バージョンを公開すると、旧バージョンは自動的に適用終了になります
              </p>
              <RoleGatedButton
                allowedRoles={[UserRole.Headquarter, UserRole.System]}
                size="sm"
                className="shrink-0 gap-1 text-xs"
                onClick={() => router.push(navigate('/terms/[id]/new-version', terms.id))}
              >
                <Plus className="size-3" />
                新規バージョン作成
              </RoleGatedButton>
            </div>
            <VersionTimeline versions={terms.versions} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
