'use client';

import { useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Clock, Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmFamilyRegistrationsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';

import { ApplicantTab } from './_components/applicant-tab';
import { FamilyRegistrationBasicInfoCard } from './_components/basic-info-card';
import { EkycTab } from './_components/ekyc-tab';
import { FamilyRegistrationDetailFooter } from './_components/family-registration-detail-footer';
import { FamilyRegistrationDetailSkeleton } from './_components/family-registration-detail-skeleton';
import { PaymentInfoTab } from './_components/payment-info-tab';
import { PrimaryMemberTab } from './_components/primary-member-tab';
import { FamilyRegistrationRiskDetailsSection } from './_components/risk-details-section';

const BREADCRUMB_ITEMS = [
  { url: '/family-registrations', label: '家族入会' },
  { label: '家族入会申請詳細' },
] as const;

export default function FamilyRegistrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState(() => tab || 'applicant');

  const { data, isLoading, error } = useQuery(
    getCrmFamilyRegistrationsByIdOptions({
      path: { id },
    }),
  );

  if (isLoading) {
    return <FamilyRegistrationDetailSkeleton />;
  }

  if (error || !data?.registration) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-destructive">申請情報が見つかりません</div>
      </div>
    );
  }

  const registration = data.registration;
  const showRiskSection =
    registration.status === 'pending_review' &&
    ((registration.risk_score ?? 0) > 0 || !!registration.ekyc);

  return (
    <div className="flex flex-1 flex-col pb-[70px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        <BreadcrumbNav items={BREADCRUMB_ITEMS} variant="section" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            className="gap-2"
            onClick={() => toast.info('準備中です')}
          >
            <Download className="size-4" />
            エクスポート
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="default" className="gap-2" />}
            >
              その他の操作
              <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info('準備中です')}>
                <Printer className="mr-2 size-4" />
                印刷
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('準備中です')}>
                <Clock className="mr-2 size-4" />
                保留
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/family-registrations')}>
                一覧へ戻る
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        {/* Basic Info Card */}
        <FamilyRegistrationBasicInfoCard registration={registration} />

        {/* Risk Details Section — 要確認案件のみ表示 */}
        {showRiskSection && (
          <FamilyRegistrationRiskDetailsSection
            riskScore={registration.risk_score ?? 0}
            riskReason={registration.risk_reason ?? ''}
            riskDetails={registration.risk_details ?? []}
          />
        )}

        {/* Tabs */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
            <TabsList className="border-b bg-transparent">
              <TabsTrigger value="applicant" className="data-[state=active]:bg-secondary">
                申請者情報
              </TabsTrigger>
              <TabsTrigger value="primary-member" className="data-[state=active]:bg-secondary">
                主会員情報
              </TabsTrigger>
              <TabsTrigger value="ekyc" className="data-[state=active]:bg-secondary">
                eKYC検証
              </TabsTrigger>
              <TabsTrigger value="payment" className="data-[state=active]:bg-secondary">
                決済情報
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-1 overflow-auto">
              <TabsContent value="applicant" className="mt-4 flex-1">
                <ApplicantTab registration={registration} />
              </TabsContent>
              <TabsContent value="primary-member" className="mt-4 flex-1">
                <PrimaryMemberTab registration={registration} />
              </TabsContent>
              <TabsContent value="ekyc" className="mt-4 flex-1">
                <EkycTab ekyc={registration.ekyc} />
              </TabsContent>
              <TabsContent value="payment" className="mt-4 flex-1">
                <PaymentInfoTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Action Footer (承認 / 却下) */}
      <FamilyRegistrationDetailFooter registration={registration} />
    </div>
  );
}
