'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { type GetCrmStaffsByIdResponse } from '@/lib/api/types.gen';

type Staff = GetCrmStaffsByIdResponse['staff'];

interface StaffLoginInfoCardProps {
  staff: Staff;
}

export function StaffLoginInfoCard({ staff }: StaffLoginInfoCardProps) {
  const personal = staff.personal_info;
  const login = staff.login_settings;

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base">ログイン情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground text-xs font-medium">ログイン元</div>
            <div className="mt-1 text-sm break-all">{personal.email ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-medium">ソーシャルID</div>
            <div className="mt-1 text-sm">{login.social_id ?? '—'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
