'use client';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmStaffsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { StaffStatus } from '../_constants/constants';
import { PermissionHistoryTab } from './_components/permission-history-tab';
import { StaffDetailHeader } from './_components/staff-detail-header';
import { StaffDetailSkeleton } from './_components/staff-detail-skeleton';
import { StaffLoginInfoCard } from './_components/staff-login-info-card';
import { StaffPermissionCard } from './_components/staff-permission-card';
import { StaffPersonalInfoCard } from './_components/staff-personal-info-card';
import { StaffStatusCard } from './_components/staff-status-card';

export default function StaffDetailPage() {
  const params = useParams();
  const staffId = params.id as string;

  const router = useRouter();

  const { data, isLoading, isError, error, refetch } = useQuery(
    getCrmStaffsByIdOptions({
      path: { id: staffId },
    }),
  );

  if (isLoading) return <StaffDetailSkeleton />;

  if (isError || !data?.staff) {
    const status = (error as { status?: number } | null)?.status;

    // 403/404 are expected, "clean" outcomes (no view permission / record deleted or
    // never existed) — not the generic transient-failure case DataStateBoundary's
    // default copy describes, and retrying can't change either outcome.
    if (status === 403) {
      return (
        <DataStateBoundary
          isLoading={false}
          isError
          isEmpty={false}
          errorTitle="アクセス権限がありません"
          errorDescription="このスタッフ情報を閲覧する権限がありません。"
        />
      );
    }
    if (status === 404) {
      return (
        <DataStateBoundary
          isLoading={false}
          isError
          isEmpty={false}
          errorTitle="スタッフが見つかりません"
          errorDescription="このスタッフは存在しないか、削除された可能性があります。"
        />
      );
    }

    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.staff}
        onRetry={() => refetch()}
      />
    );
  }

  const { staff } = data;
  const fullName = `${staff.personal_info.last_name} ${staff.personal_info.first_name}`.trim();
  const staffStatus = staff.status as StaffStatus;

  const handleEdit = () => {
    router.push(navigate('/staffs/[id]/edit', staffId));
  };
  const handleBack = () => {
    router.push(navigate('/staffs'));
  };

  return (
    <div className="flex flex-1 flex-col">
      <StaffDetailHeader
        staffId={staffId}
        fullName={fullName}
        staffStatus={staffStatus}
        staffRole={staff.role}
        linkedStoreId={
          staff.staff_linkage.type === 'direct_store' ? staff.staff_linkage.store_id : undefined
        }
        onEdit={handleEdit}
        onBack={handleBack}
      />

      <div className="flex-1 overflow-auto px-6 py-4">
        <Tabs defaultValue="info" className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="info">基本情報</TabsTrigger>
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex flex-col gap-4 lg:w-[60%]">
                <StaffPersonalInfoCard staff={staff} />
                <StaffPermissionCard staff={staff} />
                {staff.note && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">備考</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                        {staff.note}
                      </p>
                    </CardContent>
                  </Card>
                )}
                <StaffLoginInfoCard staff={staff} />
              </div>

              <div className="flex flex-col gap-4 lg:sticky lg:top-0 lg:w-[40%]">
                <StaffStatusCard staff={staff} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <PermissionHistoryTab staffId={staffId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
