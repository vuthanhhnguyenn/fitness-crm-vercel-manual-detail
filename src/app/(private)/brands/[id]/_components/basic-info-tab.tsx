import { formatDate } from '@/utils/format.util';
import { Tag } from 'lucide-react';

import { StatusCard } from '@/components/common/status-card';
import { Card } from '@/components/ui/card';

import type { GetCrmBrandsByIdResponse } from '@/lib/api/types.gen';

type BrandDetail = NonNullable<GetCrmBrandsByIdResponse>['brand'];

interface BasicInfoTabProps {
  brand: BrandDetail;
}

export function BasicInfoTab({ brand }: BasicInfoTabProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <div className="xl:w-[60%]">
        <Card className="overflow-hidden rounded-lg border p-0">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold">一般情報</h2>
          </div>
          <div className="grid gap-x-8 gap-y-4 px-5 py-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-xs leading-none">ブランドID</p>
              <p className="font-mono text-sm leading-6 font-medium">{brand.brand_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs leading-none">ブランド名</p>
              <p className="text-sm leading-6 font-semibold">{brand.display_name}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="xl:w-[40%]">
        <div className="sticky top-4 flex flex-col gap-4">
          <StatusCard
            tone={brand.status === 'active' ? 'success' : 'warning'}
            icon={Tag}
            label={brand.status === 'active' ? '有効' : '無効'}
            meta={[
              `作成: ${formatDate(brand.created_at)}`,
              `更新: ${formatDate(brand.updated_at)}`,
            ]}
          />
        </div>
      </div>
    </div>
  );
}
