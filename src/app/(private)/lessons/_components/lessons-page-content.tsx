'use client';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  getCrmLessonContentsOptions,
  getCrmPersonalPlansOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { LESSON_TABS, type LessonTab } from '../_constants/constants';
import { useLessonsFilters } from '../_hooks/use-lessons-filters';
import { LessonTable } from './lesson-table';
import { PersonalTrainingTable } from './personal-training-table';

function TabCountBadge({ count }: { count: number | undefined }) {
  return (
    <Badge
      variant="outline"
      className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
    >
      {count ?? 0}
    </Badge>
  );
}

export function LessonsPageContent() {
  const router = useRouter();
  const filtersHook = useLessonsFilters();
  const { filters, changeTab } = filtersHook;

  // Lightweight per-tab counts for the tab badges + header total (scope only).
  const { data: studioCount } = useQuery({
    ...getCrmLessonContentsOptions({ query: { kind: 'studio', limit: 1 } }),
  });
  const { data: bodycareCount } = useQuery({
    ...getCrmLessonContentsOptions({ query: { kind: 'bodycare', limit: 1 } }),
  });
  const { data: personalCount } = useQuery({
    ...getCrmPersonalPlansOptions({ query: { limit: 1 } }),
  });

  const studioTotal = studioCount?.pagination.total;
  const bodycareTotal = bodycareCount?.pagination.total;
  const personalTotal = personalCount?.pagination.total;
  const headerTotal = (studioTotal ?? 0) + (personalTotal ?? 0) + (bodycareTotal ?? 0);

  const tabCounts: Record<LessonTab, number | undefined> = {
    studio: studioTotal,
    personal: personalTotal,
    bodycare: bodycareTotal,
  };

  const handleTabChange = (value: string) => {
    changeTab(value as LessonTab);
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        title="レッスン内容管理"
        badge={
          <Badge variant="secondary" className="text-xs">
            {headerTotal.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.LessonContentsCreate}
            type="button"
            className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
            onClick={() => router.push(navigate('/lessons/create'))}
          >
            <Plus className="size-3.5" />
            新規レッスン作成
          </RoleGatedButton>
        }
      />

      <div className="px-6 py-4">
        <Tabs value={filters.tab} onValueChange={handleTabChange} className="gap-4">
          <TabsList variant="line">
            {LESSON_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                {tab.label}
                <TabCountBadge count={tabCounts[tab.value]} />
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="studio">
            <LessonTable kind="studio" filtersHook={filtersHook} />
          </TabsContent>
          <TabsContent value="personal">
            <PersonalTrainingTable filtersHook={filtersHook} />
          </TabsContent>
          <TabsContent value="bodycare">
            <LessonTable kind="bodycare" filtersHook={filtersHook} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
