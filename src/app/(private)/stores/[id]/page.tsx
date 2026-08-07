'use client';

import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Circle, Pencil, TriangleAlert } from 'lucide-react';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmStoresByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { STORE_STATUS_BADGE_CLASSES, STORE_STATUS_LABELS } from '../_constants/constants';
import { AccessSettingsTab } from './_components/tabs/access-settings-tab';
import { BasicInfoTab } from './_components/tabs/basic-info-tab';
import { BusinessSettingsTab } from './_components/tabs/business-settings-tab';
import { ContractTab } from './_components/tabs/contract-tab';

export default function StoreDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmStoresByIdOptions({ path: { id } }),
    enabled: Boolean(id),
  });

  const store = data?.store;

  if (isLoading || isError || !store) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!store}
        onRetry={() => refetch()}
        errorTitle="店舗情報の取得に失敗しました"
      />
    );
  }

  const tabTriggerClass =
    'data-[state=active]:bg-background flex items-center gap-1.5 rounded-md px-3 py-1 text-sm ' +
    'data-[state=active]:shadow-sm disabled:opacity-50';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-neutral-50">
      <div className="shrink-0 space-y-4 px-4 pt-6 pb-4 md:px-8">
        <div className="space-y-4">
          <BreadcrumbNav
            items={[{ url: navigate('/stores'), label: '店舗管理' }, { label: '店舗詳細' }]}
            variant="section"
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground text-xl font-bold tracking-tight">{store.name}</h1>
            <Badge className={`border ${STORE_STATUS_BADGE_CLASSES[store.status]}`}>
              <span className="inline-flex items-center gap-2">
                <Circle className="size-2 shrink-0 fill-current" aria-hidden />
                {STORE_STATUS_LABELS[store.status]}
              </span>
            </Badge>
          </div>
        </div>

        <Alert className="rounded-lg border-amber-500 bg-amber-50/90 px-2.5 py-2" role="status">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          <AlertDescription className="text-muted-foreground col-start-2 text-sm leading-relaxed">
            掲載期間や入退室設定の変更は、会員の利用に即時反映されます。
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-6 md:px-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0 overflow-hidden"
        >
          <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="basic" className={tabTriggerClass}>
                基本情報
              </TabsTrigger>
              <TabsTrigger value="business" className={tabTriggerClass}>
                営業設定
              </TabsTrigger>
              <TabsTrigger value="contract" className={tabTriggerClass}>
                契約・料金
              </TabsTrigger>
              <TabsTrigger value="access" className={tabTriggerClass}>
                入退室設定
              </TabsTrigger>
            </TabsList>
            {activeTab === 'basic' && (
              <RoleGatedButton
                requiredPermission={Permission.StoresEdit}
                type="button"
                variant="outline"
                size="sm"
                className="border-border bg-card shrink-0 gap-2 rounded-lg px-4"
                onClick={() => router.push(navigate('/stores/[id]/edit', store.id))}
              >
                <Pencil className="size-4" />
                基本情報を編集
              </RoleGatedButton>
            )}
          </div>

          <ScrollArea className="mt-4 min-h-0 min-w-0 flex-1 overflow-hidden pr-2">
            <TabsContent value="basic" className="focus-visible:outline-none">
              <BasicInfoTab store={store} />
            </TabsContent>
            <TabsContent value="business" className="focus-visible:outline-none">
              <BusinessSettingsTab storeId={store.id} />
            </TabsContent>
            <TabsContent value="contract" className="focus-visible:outline-none">
              <ContractTab />
            </TabsContent>
            <TabsContent value="access" className="focus-visible:outline-none">
              <AccessSettingsTab storeId={store.id} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
