'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  STORE_STATUS_BADGE_CLASSES,
  STORE_STATUS_LABELS,
} from '@/app/(private)/stores/_constants/constants';
import { ExternalLink, Link2, Unlink } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { FranchiseCompanyLinkedStore } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { FRANCHISE_COMPANY_LINKED_STORE_LABELS } from '../_constants/detail.constants';
import { LinkStoreDialog } from './link-store-dialog';
import { UnlinkStoreDialog } from './unlink-store-dialog';

interface LinkedStoresTabProps {
  companyId: string;
  linkedStores: FranchiseCompanyLinkedStore[];
}

export function LinkedStoresTab({ companyId, linkedStores }: Readonly<LinkedStoresTabProps>) {
  const router = useRouter();
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-xs">
          店舗の紐づけ・解除は本部が設定できます。変更は変更履歴に記録されます。
        </p>
        <RoleGatedButton
          requiredPermission={Permission.FCCompaniesEdit}
          denyTooltip="店舗紐づけの設定には本部権限が必要です"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => setLinkOpen(true)}
        >
          <Link2 className="size-4" />
          店舗を紐づけ
        </RoleGatedButton>
      </div>

      <Card className="gap-0 py-0">
        <Table size="md">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px] text-xs font-semibold">
                {FRANCHISE_COMPANY_LINKED_STORE_LABELS.store_id}
              </TableHead>
              <TableHead className="min-w-[200px] text-xs font-semibold">
                {FRANCHISE_COMPANY_LINKED_STORE_LABELS.name}
              </TableHead>
              <TableHead className="w-[120px] text-xs font-semibold">
                {FRANCHISE_COMPANY_LINKED_STORE_LABELS.brand}
              </TableHead>
              <TableHead className="w-[120px] text-xs font-semibold">
                {FRANCHISE_COMPANY_LINKED_STORE_LABELS.prefecture}
              </TableHead>
              <TableHead className="w-[100px] text-xs font-semibold">
                {FRANCHISE_COMPANY_LINKED_STORE_LABELS.status}
              </TableHead>
              <TableHead className="w-20 text-xs font-semibold" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkedStores.length > 0 ? (
              linkedStores.map((store) => (
                <TableRow key={store.id} className="hover:bg-muted/50">
                  <TableCell
                    className="text-muted-foreground cursor-pointer text-xs"
                    onClick={() => router.push(navigate('/stores/[id]', store.id))}
                  >
                    {store.store_id}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-xs font-medium"
                    onClick={() => router.push(navigate('/stores/[id]', store.id))}
                  >
                    {store.name}
                  </TableCell>
                  <TableCell onClick={() => router.push(navigate('/stores/[id]', store.id))}>
                    <BrandBadge brand={store.brand} />
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-xs"
                    onClick={() => router.push(navigate('/stores/[id]', store.id))}
                  >
                    {store.prefecture ?? '—'}
                  </TableCell>
                  <TableCell onClick={() => router.push(navigate('/stores/[id]', store.id))}>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STORE_STATUS_BADGE_CLASSES[store.status]}`}
                    >
                      {STORE_STATUS_LABELS[store.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <RoleGatedButton
                        requiredPermission={Permission.FCCompaniesEdit}
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        denyTooltip="店舗紐づけの設定には本部権限が必要です"
                        tooltip="解除"
                        onClick={() => setUnlinkTarget({ id: store.id, name: store.name })}
                      >
                        <Unlink className="text-muted-foreground size-3.5" />
                      </RoleGatedButton>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => router.push(navigate('/stores/[id]', store.id))}
                      >
                        <ExternalLink className="text-muted-foreground size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  表示できる管轄店舗がありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">全 {linkedStores.length} 件</p>
        </div>
      </Card>

      <LinkStoreDialog companyId={companyId} open={linkOpen} onOpenChange={setLinkOpen} />
      <UnlinkStoreDialog
        companyId={companyId}
        store={unlinkTarget}
        onOpenChange={(open) => {
          if (!open) setUnlinkTarget(null);
        }}
      />
    </div>
  );
}
