'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmLockersContractsByIdResponse } from '@/lib/api/types.gen';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];

type LockerContractMemberSectionProps = {
  contract: LockerContractDetail;
};

/**
 * Contract holder info (display only).
 * E-01: locker contracts are edit-only and the holder is never reassigned, so there are no inputs.
 */
export function LockerContractMemberSection({ contract }: LockerContractMemberSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">契約者情報</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="bg-muted/50 rounded-lg border px-4 py-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-muted-foreground text-xs">会員ID</p>
              <p className="text-sm font-medium">{contract.member_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">氏名</p>
              <p className="text-sm font-medium">{contract.member_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">電話番号</p>
              <p className="text-sm">{contract.member_phone || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">メール</p>
              <p className="text-sm">{contract.member_email || '—'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
