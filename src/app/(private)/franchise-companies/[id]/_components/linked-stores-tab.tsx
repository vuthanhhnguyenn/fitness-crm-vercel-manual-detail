'use client';

import { useRouter } from 'next/navigation';

import {
  STORE_STATUS_BADGE_CLASSES,
  STORE_STATUS_LABELS,
} from '@/app/(private)/stores/_constants/constants';
import { ExternalLink } from 'lucide-react';

import { BrandBadge } from '@/components/common/brand-badge';
import { Badge } from '@/components/ui/badge';
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

import { FRANCHISE_COMPANY_LINKED_STORE_LABELS } from '../_constants/detail.constants';

interface LinkedStoresTabProps {
  linkedStores: FranchiseCompanyLinkedStore[];
}

export function LinkedStoresTab({ linkedStores }: Readonly<LinkedStoresTabProps>) {
  const router = useRouter();

  return (
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
            <TableHead className="w-10 text-xs font-semibold" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {linkedStores.length > 0 ? (
            linkedStores.map((store) => (
              <TableRow
                key={store.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(navigate('/stores/[id]', store.id))}
              >
                <TableCell className="text-muted-foreground text-xs">{store.store_id}</TableCell>
                <TableCell className="text-xs font-medium">{store.name}</TableCell>
                <TableCell>
                  <BrandBadge brand={store.brand} />
                </TableCell>
                <TableCell className="text-xs">{store.prefecture ?? '—'}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${STORE_STATUS_BADGE_CLASSES[store.status]}`}
                  >
                    {STORE_STATUS_LABELS[store.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ExternalLink className="text-muted-foreground size-3" />
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
  );
}
