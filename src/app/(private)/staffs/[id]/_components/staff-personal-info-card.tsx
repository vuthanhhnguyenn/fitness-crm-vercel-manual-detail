'use client';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { formatGenderLabel } from '@/utils/global.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { type GetCrmStaffsByIdResponse } from '@/lib/api/types.gen';

import { STAFF_ROLE_LABELS, type StaffRole } from '../../_constants/constants';

type Staff = GetCrmStaffsByIdResponse['staff'];

interface StaffPersonalInfoCardProps {
  staff: Staff;
}

export function StaffPersonalInfoCard({ staff }: StaffPersonalInfoCardProps) {
  const personal = staff.personal_info;

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base">個人情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <div className="text-muted-foreground text-xs font-medium">管理者ID</div>
            <div className="mt-1 text-sm">{staff.staff_id}</div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs font-medium">氏名（姓）</div>
              <div className="mt-1 text-sm">{personal.last_name}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium">氏名（名）</div>
              <div className="mt-1 text-sm">{personal.first_name}</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs font-medium">カタカナ（姓）</div>
              <div className="mt-1 text-sm">{personal.last_name_kana ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium">カタカナ（名）</div>
              <div className="mt-1 text-sm">{personal.first_name_kana ?? '—'}</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs font-medium">性別</div>
              <div className="mt-1 text-sm">{formatGenderLabel(personal.gender)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium">生年月日</div>
              <div className="mt-1 text-sm">{formatDateYYYYMMDD(personal.birthday)}</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs font-medium">役職</div>
              <div className="mt-1 text-sm">
                {STAFF_ROLE_LABELS[staff.role as StaffRole] ?? '—'}
              </div>
            </div>
            <div />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-xs font-medium">携帯電話番号</div>
              <div className="mt-1 text-sm">{personal.phone ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs font-medium">メールアドレス</div>
              <div className="mt-1 text-sm break-all">{personal.email}</div>
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs font-medium">住所</div>
            <div className="mt-1 text-sm">
              {personal.postal_code ? `${personal.postal_code} ` : ''}
              {personal.prefecture ?? ''}
              {personal.city ?? ''}
              {personal.address ?? ''}
              {personal.building ? ` ${personal.building}` : ''}
              {!personal.prefecture && !personal.city && !personal.address ? '—' : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
