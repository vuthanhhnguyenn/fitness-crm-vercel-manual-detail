import { Ban, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Card } from '@/components/ui/card';

import { Permission } from '@/types/permission.type';

import type { BrandFeeGroup } from '../_types/brand-fee.type';
import { BrandStatusBadge } from './brand-status-badge';
import { FeeItemBlock } from './fee-item-block';

export function FeeGroupCard({
  feeGroup,
  hasMultipleSubBrands,
  onEdit,
  onDisable,
  onDelete,
}: {
  feeGroup: BrandFeeGroup;
  hasMultipleSubBrands: boolean;
  onEdit: (feeGroup: BrandFeeGroup) => void;
  onDisable: (feeGroup: BrandFeeGroup) => void;
  onDelete: (feeGroup: BrandFeeGroup) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border p-0">
      <div className="flex flex-col gap-3 border-b px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm leading-6 font-semibold text-slate-900">
            {hasMultipleSubBrands
              ? `${feeGroup.parent_brand_name} / ${feeGroup.display_name}`
              : feeGroup.parent_brand_name}
          </h3>
          <BrandStatusBadge status={feeGroup.status} showDot={false} />
          <span className="rounded-full bg-slate-100 px-2 py-0 text-[12px] font-medium text-slate-600">
            {feeGroup.fee_master_id}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RoleGatedButton
            type="button"
            variant="outline"
            className="h-7 gap-1 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium"
            requiredPermission={Permission.BrandsEdit}
            denyTooltip="本部権限が必要です"
            onClick={() => onEdit(feeGroup)}
          >
            <Pencil className="size-3.5" />
            編集
          </RoleGatedButton>
          <RoleGatedButton
            type="button"
            variant="outline"
            className="text-warning hover:bg-muted hover:text-warning h-7 gap-1 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium"
            requiredPermission={Permission.BrandsEdit}
            denyTooltip="本部権限が必要です"
            disabled={feeGroup.status === 'inactive'}
            onClick={() => onDisable(feeGroup)}
          >
            <Ban className="size-3.5" />
            無効化
          </RoleGatedButton>
          <RoleGatedButton
            type="button"
            variant="outline"
            className="text-destructive hover:bg-muted hover:text-destructive text-destructive h-7 gap-1 rounded-md border-slate-200 bg-white px-2.5 text-xs font-medium"
            requiredPermission={Permission.BrandsEdit}
            denyTooltip="本部権限が必要です"
            onClick={() => onDelete(feeGroup)}
          >
            <Trash2 className="size-3.5" />
            削除
          </RoleGatedButton>
        </div>
      </div>

      <div>
        {feeGroup.fee_items.map((feeItem, index) => (
          <FeeItemBlock
            key={feeItem.item_code}
            feeItem={feeItem}
            itemNumber={index + 1}
            status={feeGroup.status}
          />
        ))}
      </div>
    </Card>
  );
}
