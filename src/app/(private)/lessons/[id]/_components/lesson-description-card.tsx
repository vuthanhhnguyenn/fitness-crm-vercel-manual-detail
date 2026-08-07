import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLessonContentsByIdResponse } from '@/lib/api/types.gen';

type LessonDetail = NonNullable<GetCrmLessonContentsByIdResponse>['data'];

interface LessonDescriptionCardProps {
  detail: LessonDetail;
}

/** Read-only "レッスン内容説明" card (FR-003-P1-06). */
export function LessonDescriptionCard({ detail }: LessonDescriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">レッスン内容説明</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {detail.description?.trim() ? detail.description : '説明はありません'}
        </p>
      </CardContent>
    </Card>
  );
}
