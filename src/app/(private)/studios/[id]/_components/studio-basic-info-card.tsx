import type { StudioDetail } from '@/app/api/_schemas/studio-detail.schema';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';

interface StudioBasicInfoCardProps {
  studio: StudioDetail;
}

export function StudioBasicInfoCard({ studio }: StudioBasicInfoCardProps) {
  return (
    <Card>
      <CardContent className="px-4">
        <h2 className="mb-4 text-sm font-bold">基本情報</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">スタジオID</p>
            <p className="text-sm font-medium">{studio.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">スタジオ名</p>
            <p className="text-sm font-medium">{studio.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">区分</p>
            <p className="text-sm font-medium">
              {studio.studio_type === 'studio-lesson' && 'スタジオレッスン'}
              {studio.studio_type === 'pt' && 'パーソナル'}
              {studio.studio_type === 'body-care' && 'ボディケア'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">物理定員</p>
            <p className="text-sm">{studio.capacity}名</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">バッファ値</p>
            <p className="text-sm">{studio.buffer_value}名</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">利用時間</p>
            <p className="text-sm">{studio.usage_hours}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">所属店舗</p>
            <p className="text-sm">{studio.store_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">登録日</p>
            <p className="text-sm">
              {format(new Date(studio.created_at), 'yyyy年M月d日 HH:mm', {
                locale: ja,
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">更新日</p>
            <p className="text-sm">
              {format(new Date(studio.updated_at), 'yyyy年M月d日 HH:mm', {
                locale: ja,
              })}
            </p>
          </div>
        </div>
        {studio.equipment_notes && (
          <div className="mt-4 border-t pt-4">
            <p className="text-muted-foreground mb-1 text-xs">設備・備品</p>
            <p className="text-sm">{studio.equipment_notes}</p>
          </div>
        )}
        {studio.internal_notes && (
          <div className="mt-3 border-t pt-3">
            <p className="text-muted-foreground mb-1 text-xs">備考</p>
            <p className="text-sm">{studio.internal_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
