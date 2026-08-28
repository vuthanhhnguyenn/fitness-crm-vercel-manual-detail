'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { type GetCrmStaffsByIdResponse } from '@/lib/api/types.gen';

type Staff = GetCrmStaffsByIdResponse['staff'];

interface StaffPersonalInfoCardProps {
  staff: Staff;
}

/** 基本情報 card — スタッフID / 氏名 / メールアドレス（ログインID） — src: staff-detail.tsx L209-229 */
export function StaffPersonalInfoCard({ staff }: StaffPersonalInfoCardProps) {
  const personal = staff.personal_info;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">基本情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">スタッフID</p>
            <p className="text-sm">{staff.staff_id}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">氏名</p>
            <p className="text-sm font-medium">
              {personal.last_name} {personal.first_name}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground mb-1 text-xs">メールアドレス（ログインID）</p>
            <p className="text-sm">{personal.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
