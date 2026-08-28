import { Card, CardContent } from '@/components/ui/card';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';

type Instructor = GetCrmInstructorsByIdResponse['data'];

export function InstructorProfileCard({ instructor }: { instructor: Instructor }) {
  return (
    <Card>
      <CardContent className="px-4">
        <h2 className="mb-3 text-sm font-bold">プロフィール</h2>
        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">プロフィール文</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {instructor.profile_text || <span className="text-muted-foreground">未設定</span>}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">指導歴</p>
            <p className="text-sm whitespace-pre-wrap">
              {instructor.instructing_history || (
                <span className="text-muted-foreground">未設定</span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
