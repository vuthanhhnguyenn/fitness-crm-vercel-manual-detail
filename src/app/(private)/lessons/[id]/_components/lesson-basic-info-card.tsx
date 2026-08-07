import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLessonContentsByIdResponse } from '@/lib/api/types.gen';

import {
  LESSON_DETAIL_STATUS_LABELS,
  LESSON_PRICING_TYPE_LABELS,
  LESSON_TYPE_BADGE_LABELS,
  getTimeRowLabel,
} from '../_constants/constants';

type LessonDetail = NonNullable<GetCrmLessonContentsByIdResponse>['data'];

const BRAND_LABELS: Record<LessonDetail['brand'], string> = {
  joyfit: 'JOYFIT',
  fit365: 'FIT365',
};

const BRAND_CLASSES: Record<LessonDetail['brand'], string> = {
  joyfit: 'bg-primary/15 text-primary border-primary/20',
  fit365: 'bg-destructive/15 text-destructive border-destructive/20',
};

interface LessonBasicInfoCardProps {
  detail: LessonDetail;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/** "基本情報" card: ID / type / brand / time (実施 or セッション) / pricing (FR-003-P1-03). */
export function LessonBasicInfoCard({ detail }: LessonBasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">基本情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <InfoRow label="ID" value={detail.id} />
          <InfoRow label="レッスン種別" value={LESSON_TYPE_BADGE_LABELS[detail.lesson_type]} />
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground text-xs">ブランド</span>
            <Badge variant="outline" className={`text-[10px] ${BRAND_CLASSES[detail.brand]}`}>
              {BRAND_LABELS[detail.brand]}
            </Badge>
          </div>
          <InfoRow label={getTimeRowLabel(detail.lesson_type)} value={`${detail.duration}分`} />
          <InfoRow label="料金種別" value={LESSON_PRICING_TYPE_LABELS[detail.pricing_type]} />
          <InfoRow label="ステータス" value={LESSON_DETAIL_STATUS_LABELS[detail.status]} />
        </div>
      </CardContent>
    </Card>
  );
}
