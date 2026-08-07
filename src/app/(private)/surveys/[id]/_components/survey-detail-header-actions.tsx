'use client';

import { useRouter } from 'next/navigation';

import { BarChart3, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

interface SurveyDetailHeaderActionsProps {
  surveyId: string;
  onDeleteClick: () => void;
}

export function SurveyDetailHeaderActions({
  surveyId,
  onDeleteClick,
}: SurveyDetailHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
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
        requiredPermission={Permission.SurveysEdit}
        className="gap-1"
        onClick={() => router.push(navigate('/surveys/[id]/edit', surveyId))}
      >
        <Pencil className="size-4" />
        編集
      </RoleGatedButton>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <RoleGatedMenuItem
            requiredPermission={Permission.SurveysDelete}
            className="text-destructive focus:text-destructive"
            onClick={onDeleteClick}
          >
            <Trash2 className="size-4" />
            削除
          </RoleGatedMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
