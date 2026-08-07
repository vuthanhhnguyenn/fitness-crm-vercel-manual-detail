import type { GetCrmLessonContentsByIdResponse } from '@/lib/api/types.gen';

import { LessonBasicInfoCard } from './lesson-basic-info-card';
import { LessonDescriptionCard } from './lesson-description-card';
import { LessonImageGallery } from './lesson-image-gallery';
import { LessonInternalMemoCard } from './lesson-internal-memo-card';
import { LessonRecentScheduleCard } from './lesson-recent-schedule-card';
import { LessonRestrictionCard } from './lesson-restriction-card';
import { LessonStatusCard } from './lesson-status-card';

type LessonDetail = NonNullable<GetCrmLessonContentsByIdResponse>['data'];

interface LessonInfoTabProps {
  detail: LessonDetail;
}

/**
 * Basic Info tab — two-column layout.
 * Left (flex-1): image gallery + description.
 * Right (360px): status card, basic info, restriction & pricing, recent
 * schedule, internal memo.
 */
export function LessonInfoTab({ detail }: LessonInfoTabProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <LessonImageGallery images={detail.images} lessonName={detail.name} />
        <LessonDescriptionCard detail={detail} />
      </div>

      <div className="w-full shrink-0 space-y-4 lg:w-[360px]">
        <LessonStatusCard detail={detail} />
        <LessonBasicInfoCard detail={detail} />
        <LessonRestrictionCard detail={detail} />
        <LessonRecentScheduleCard lessonId={detail.id} lessonName={detail.name} />
        <LessonInternalMemoCard detail={detail} />
      </div>
    </div>
  );
}
