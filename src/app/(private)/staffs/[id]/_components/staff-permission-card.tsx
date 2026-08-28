'use client';

import Link from 'next/link';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getCrmPositionsOptions, getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
import { type GetCrmStaffsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  STAFF_ROLE_BADGE_CLASSES,
  STAFF_ROLE_LABELS,
  type StaffRole,
} from '../../_constants/constants';

type Staff = GetCrmStaffsByIdResponse['staff'];

interface StaffPermissionCardProps {
  staff: Staff;
}

/**
 * 所属・権限 card — ロール / 職位 / 所属 (store or FC pattern) / position-permissions link
 * src: staff-detail.tsx L231-282
 */
export function StaffPermissionCard({ staff }: StaffPermissionCardProps) {
  const role = staff.role as StaffRole;
  const linkage = staff.staff_linkage;
  const isFcLinkage = linkage.type === 'fc_company';

  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({ query: { page: 1, limit: 100 } }),
    enabled: isFcLinkage,
  });
  const managedStores = isFcLinkage
    ? (storesRes?.stores ?? []).filter((s) => s.fc_company_id === linkage.fc_company_id)
    : [];

  const { data: positionsRes } = useQuery(getCrmPositionsOptions());
  const positionName =
    positionsRes?.items.find((p) => p.id === staff.position_id)?.position_name ?? '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">所属・権限</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">ロール</p>
            <Badge variant="outline" className={`text-xs ${STAFF_ROLE_BADGE_CLASSES[role]}`}>
              {STAFF_ROLE_LABELS[role] || '-'}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">職位</p>
            <Badge variant="secondary" className="text-xs">
              {positionName}
            </Badge>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground mb-1 text-xs">所属</p>
            {linkage.type === 'direct_store' ? (
              <>
                <p className="text-sm">{linkage.store_name ?? '未設定'}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">パターンA: 店舗直接紐づき</p>
              </>
            ) : (
              <>
                <p className="text-sm">{linkage.fc_company_name ?? '未設定'}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  パターンB: FC企業紐づき（管轄{managedStores.length}店舗）
                </p>
                {managedStores.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {managedStores.map((store) => (
                      <Badge key={store.id} variant="outline" className="text-[10px]">
                        {store.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="col-span-2 border-t pt-2">
            <Link
              href={navigate('/positions', { id: staff.position_id })}
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              {positionName}の権限を確認
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
