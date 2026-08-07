import { EyeOff } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLessonContentsByIdResponse } from '@/lib/api/types.gen';

type LessonDetail = NonNullable<GetCrmLessonContentsByIdResponse>['data'];

interface LessonInternalMemoCardProps {
  detail: LessonDetail;
}

/** "内部メモ・備考" card, labeled 会員には非表示 (FR-003-P1-07). */
export function LessonInternalMemoCard({ detail }: LessonInternalMemoCardProps) {
  return (
    <Card className="border-muted bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-muted-foreground/15 flex size-6 shrink-0 items-center justify-center rounded-full">
            <EyeOff className="text-muted-foreground size-4" />
          </div>
          <CardTitle className="text-base font-semibold">内部メモ・備考</CardTitle>
          <span className="text-muted-foreground bg-muted border-muted-foreground/20 ml-auto rounded-full border px-2 py-0.5 text-[10px] font-medium">
            会員には非表示
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {detail.internal_memo?.trim() ? detail.internal_memo : '特記事項なし'}
        </p>
      </CardContent>
    </Card>
  );
}
