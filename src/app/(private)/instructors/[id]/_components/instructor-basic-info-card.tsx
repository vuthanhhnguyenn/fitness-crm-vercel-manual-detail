import Image from 'next/image';

import { formatDateYYYYMMDD } from '@/utils/date.util';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';

const ROLE_LABELS: Record<string, string> = {
  trainer: 'トレーナー',
  instructor: 'インストラクター',
  body_care_therapist: 'ボディケアセラピスト',
};

type Instructor = GetCrmInstructorsByIdResponse['data'];

export function InstructorBasicInfoCard({ instructor }: { instructor: Instructor }) {
  const fullName = `${instructor.last_name} ${instructor.first_name}`;
  const romajiFullName = [instructor.romaji_last_name, instructor.romaji_first_name]
    .filter((part) => part && part.trim().length > 0)
    .join(' ');
  return (
    <Card>
      <CardContent className="px-4">
        <div className="mb-6 flex items-center gap-5">
          {instructor.photo_url ? (
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full">
              <Image
                src={instructor.photo_url}
                alt={fullName}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-medium">
              {fullName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold">{fullName}</h2>
            {romajiFullName && (
              <p className="text-muted-foreground mt-0.5 text-sm">{romajiFullName}</p>
            )}
          </div>
        </div>

        <h2 className="mb-4 text-sm font-bold">基本情報</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">指導者ID</p>
            <p className="text-sm font-medium">{instructor.instructor_id}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">ニックネーム</p>
            <p className="text-sm">
              {instructor.nickname || <span className="text-muted-foreground">未設定</span>}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">役割区分</p>
            <div className="flex flex-wrap gap-1">
              {instructor.role_classifications.map((role) => (
                <Badge key={role} variant="secondary" className="text-[11px]">
                  {ROLE_LABELS[role] ?? role}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">英字表記</p>
            <p className="text-sm">
              {romajiFullName || <span className="text-muted-foreground">未設定</span>}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">登録日</p>
            <p className="text-sm">{formatDateYYYYMMDD(instructor.created_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">更新日</p>
            <p className="text-sm">{formatDateYYYYMMDD(instructor.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
