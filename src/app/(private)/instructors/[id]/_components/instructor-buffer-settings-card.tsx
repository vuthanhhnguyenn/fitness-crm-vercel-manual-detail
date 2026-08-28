import { Card, CardContent } from '@/components/ui/card';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';

type BufferSettings = GetCrmInstructorsByIdResponse['data']['buffer_settings'];

export function InstructorBufferSettingsCard({
  bufferSettings,
}: {
  bufferSettings: BufferSettings;
}) {
  return (
    <Card>
      <CardContent className="px-4">
        <h2 className="mb-4 text-sm font-bold">予約設定</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">最短受付期間</p>
            <p className="text-sm">
              {bufferSettings.min_booking_lead_hours === 0
                ? '制限なし'
                : `${bufferSettings.min_booking_lead_hours}時間前まで`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">前バッファ</p>
            <p className="text-sm">{bufferSettings.pre_buffer_minutes}分</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">後バッファ</p>
            <p className="text-sm">{bufferSettings.post_buffer_minutes}分</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
