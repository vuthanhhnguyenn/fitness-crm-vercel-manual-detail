'use client';

import { useRouter } from 'next/navigation';

import { BarChart3, FileText, Plus } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

export function SurveyListHeaderActions() {
  const router = useRouter();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-1"
        onClick={() => router.push(navigate('/surveys/responses'))}
      >
        <FileText className="size-4" />
        回答データ
      </Button>
      <Button
        type="button"
        variant="outline"
        className="gap-1"
        onClick={() => router.push(navigate('/surveys/analytics'))}
      >
        <BarChart3 className="size-4" />
        集計分析
      </Button>
      <RoleGatedButton
        requiredPermission={Permission.SurveysCreate}
        type="button"
        className="gap-1"
        onClick={() => router.push(navigate('/surveys/create'))}
      >
        <Plus className="size-4" />
        新規作成
      </RoleGatedButton>
    </>
  );
}
