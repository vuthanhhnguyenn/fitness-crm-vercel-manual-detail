'use client';

import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { downloadCsv, getCsvFilenameFromContentDisposition } from '@/utils/csv.util';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Controllers, Equipment } from '@/lib/api';
import type { PostCrmControllersExportData, PostCrmEquipmentExportData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type SortOrder = 'asc' | 'desc';

type CsvDownload = { blob: Blob; filename: string };

function asSortOrder(value: string | null, fallback: SortOrder): SortOrder {
  return value === 'asc' || value === 'desc' ? value : fallback;
}

function EquipmentCsvExportAction() {
  const searchParams = useSearchParams();
  const { mutate, isPending } = useMutation({
    mutationFn: async (): Promise<CsvDownload> => {
      const body: NonNullable<PostCrmEquipmentExportData['body']> = {
        search: searchParams.get('equipment_search') || undefined,
        store_id: searchParams.get('equipment_store_id') || undefined,
        equipment_type:
          (searchParams.get('equipment_type') as NonNullable<
            PostCrmEquipmentExportData['body']
          >['equipment_type']) || undefined,
        status:
          (searchParams.get('equipment_status') as NonNullable<
            PostCrmEquipmentExportData['body']
          >['status']) || undefined,
        sort_by:
          (searchParams.get('equipment_sort_by') as NonNullable<
            PostCrmEquipmentExportData['body']
          >['sort_by']) || 'id',
        sort_order: asSortOrder(searchParams.get('equipment_sort_order'), 'asc'),
      };

      const { data, response } = await Equipment.postCrmEquipmentExport({
        body,
        parseAs: 'blob',
        throwOnError: true,
      });

      return {
        blob: data as Blob,
        filename: getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'equipment.csv',
        ),
      };
    },
    onSuccess: ({ blob, filename }) => {
      downloadCsv(blob, filename);
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });

  return (
    <RoleGatedButton
      variant="outline"
      className="gap-1"
      requiredPermission={Permission.EquipmentExport}
      denyTooltip="CSV出力の権限がありません"
      onClick={() => mutate()}
      disabled={isPending}
    >
      <Download className="size-4" />
      CSV出力
    </RoleGatedButton>
  );
}

function ControllerCsvExportAction() {
  const searchParams = useSearchParams();
  const { mutate, isPending } = useMutation({
    mutationFn: async (): Promise<CsvDownload> => {
      const body: NonNullable<PostCrmControllersExportData['body']> = {
        search: searchParams.get('controller_search') || undefined,
        store_id: searchParams.get('controller_store_id') || undefined,
        status:
          (searchParams.get('controller_status') as NonNullable<
            PostCrmControllersExportData['body']
          >['status']) || undefined,
        sort_by:
          (searchParams.get('controller_sort_by') as NonNullable<
            PostCrmControllersExportData['body']
          >['sort_by']) || 'controller_id',
        sort_order: asSortOrder(searchParams.get('controller_sort_order'), 'asc'),
      };

      const { data, response } = await Controllers.postCrmControllersExport({
        body,
        parseAs: 'blob',
        throwOnError: true,
      });

      return {
        blob: data as Blob,
        filename: getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'controllers.csv',
        ),
      };
    },
    onSuccess: ({ blob, filename }) => {
      downloadCsv(blob, filename);
      toast.success('CSVを出力しました');
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });

  return (
    <RoleGatedButton
      variant="outline"
      className="gap-1"
      requiredPermission={Permission.ControllerExport}
      denyTooltip="CSV出力の権限がありません"
      onClick={() => mutate()}
      disabled={isPending}
    >
      <Download className="size-4" />
      CSV出力
    </RoleGatedButton>
  );
}

function EquipmentCsvMenuItem({ onExported }: { onExported?: () => void }) {
  const searchParams = useSearchParams();
  const { mutate, isPending } = useMutation({
    mutationFn: async (): Promise<CsvDownload> => {
      const body: NonNullable<PostCrmEquipmentExportData['body']> = {
        search: searchParams.get('equipment_search') || undefined,
        store_id: searchParams.get('equipment_store_id') || undefined,
        equipment_type:
          (searchParams.get('equipment_type') as NonNullable<
            PostCrmEquipmentExportData['body']
          >['equipment_type']) || undefined,
        status:
          (searchParams.get('equipment_status') as NonNullable<
            PostCrmEquipmentExportData['body']
          >['status']) || undefined,
        sort_by:
          (searchParams.get('equipment_sort_by') as NonNullable<
            PostCrmEquipmentExportData['body']
          >['sort_by']) || 'id',
        sort_order: asSortOrder(searchParams.get('equipment_sort_order'), 'asc'),
      };

      const { data, response } = await Equipment.postCrmEquipmentExport({
        body,
        parseAs: 'blob',
        throwOnError: true,
      });

      return {
        blob: data as Blob,
        filename: getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'equipment.csv',
        ),
      };
    },
    onSuccess: ({ blob, filename }) => {
      downloadCsv(blob, filename);
      toast.success('CSVを出力しました');
      onExported?.();
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });

  return (
    <RoleGatedMenuItem
      requiredPermission={Permission.EquipmentExport}
      denyBadge="権限なし"
      disabled={isPending}
      onClick={() => mutate()}
    >
      接続機器
    </RoleGatedMenuItem>
  );
}

function ControllerCsvMenuItem({ onExported }: { onExported?: () => void }) {
  const searchParams = useSearchParams();
  const { mutate, isPending } = useMutation({
    mutationFn: async (): Promise<CsvDownload> => {
      const body: NonNullable<PostCrmControllersExportData['body']> = {
        search: searchParams.get('controller_search') || undefined,
        store_id: searchParams.get('controller_store_id') || undefined,
        status:
          (searchParams.get('controller_status') as NonNullable<
            PostCrmControllersExportData['body']
          >['status']) || undefined,
        sort_by:
          (searchParams.get('controller_sort_by') as NonNullable<
            PostCrmControllersExportData['body']
          >['sort_by']) || 'controller_id',
        sort_order: asSortOrder(searchParams.get('controller_sort_order'), 'asc'),
      };

      const { data, response } = await Controllers.postCrmControllersExport({
        body,
        parseAs: 'blob',
        throwOnError: true,
      });

      return {
        blob: data as Blob,
        filename: getCsvFilenameFromContentDisposition(
          response.headers.get('content-disposition'),
          'controllers.csv',
        ),
      };
    },
    onSuccess: ({ blob, filename }) => {
      downloadCsv(blob, filename);
      toast.success('CSVを出力しました');
      onExported?.();
    },
    onError: () => {
      toast.error('CSVの出力に失敗しました');
    },
  });

  return (
    <RoleGatedMenuItem
      requiredPermission={Permission.ControllerExport}
      denyBadge="権限なし"
      disabled={isPending}
      onClick={() => mutate()}
    >
      接点制御装置
    </RoleGatedMenuItem>
  );
}

function EquipmentCsvExportButtonContent() {
  const { hasPermission } = useAuthUser();
  const canExportEquipment = hasPermission(Permission.EquipmentExport);
  const canExportController = hasPermission(Permission.ControllerExport);

  if (!canExportEquipment && !canExportController) {
    return null;
  }

  if (canExportEquipment && !canExportController) {
    return <EquipmentCsvExportAction />;
  }

  if (canExportController && !canExportEquipment) {
    return <ControllerCsvExportAction />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="gap-1">
            <Download className="size-4" />
            CSV出力
            <ChevronDown className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <EquipmentCsvMenuItem />
        <ControllerCsvMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EquipmentCsvExportButton() {
  return (
    <Suspense
      fallback={
        <Button variant="outline" className="gap-1" disabled>
          <Download className="size-4" />
          CSV出力
        </Button>
      }
    >
      <EquipmentCsvExportButtonContent />
    </Suspense>
  );
}
