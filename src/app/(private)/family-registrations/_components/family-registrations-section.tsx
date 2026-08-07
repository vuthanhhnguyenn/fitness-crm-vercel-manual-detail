'use client';

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmFamilyRegistrationsSummaryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { FamilyRegistration as FamilyRegistrationStatus } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { PendingFamilyRegistrationsTab } from './pending-family-registrations-tab';

const STATUS_TABS: { value: FamilyRegistrationStatus['status'] | 'all'; label: string }[] = [
  { value: 'pending_review', label: '要確認' },
  { value: 'awaiting_acceptance', label: '招待承諾待ち' },
  { value: 'awaiting_profile', label: '個人情報入力待ち' },
  { value: 'completed', label: '入会完了' },
  { value: 'declined', label: '招待辞退' },
  { value: 'expired', label: '招待期限切れ' },
];

export function FamilyRegistrationsListSection() {
  const [internalStatus, setInternalStatus] = useState<FamilyRegistrationStatus['status'] | 'all'>(
    'pending_review',
  );

  const setSelectedStatus = (s: FamilyRegistrationStatus['status'] | 'all') => {
    setInternalStatus(s);
  };

  const { data: summaryData } = useQuery(getCrmFamilyRegistrationsSummaryOptions());

  const counts = useMemo(() => {
    const by = summaryData?.by_status ?? {};
    return {
      all: summaryData?.total ?? 0,
      ...by,
    } as Record<string, number>;
  }, [summaryData]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Tabs
        value={internalStatus}
        onValueChange={(status) =>
          setSelectedStatus(status as FamilyRegistrationStatus['status'] | 'all')
        }
        defaultValue="pending_review"
        className="w-full"
      >
        <TabsList className="bg-muted inline-flex h-9 w-fit rounded-lg p-[3px]">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-background flex items-center gap-1.5 rounded-md px-2 py-1 data-[state=active]:shadow-sm"
            >
              {tab.label}
              <span
                className={cn(
                  'flex h-4 min-w-4 items-center justify-center rounded-md px-1 text-xs font-semibold',
                  'bg-muted-foreground/20 text-foreground',
                )}
              >
                {counts[tab.value] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pending_review" className="mt-4">
          <PendingFamilyRegistrationsTab enabled={internalStatus === 'pending_review'} />
        </TabsContent>

        {STATUS_TABS.filter((t) => t.value !== 'pending_review').map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <Card className="rounded-lg border p-4 shadow-sm">
              <p className="text-muted-foreground text-sm">
                {tab.label} — {counts[tab.value] ?? 0}件（一覧は今後対応）
              </p>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
