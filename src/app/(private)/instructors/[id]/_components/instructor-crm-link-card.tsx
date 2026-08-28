import { Link } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import type { GetCrmInstructorsByIdResponse } from '@/lib/api/types.gen';

import { STAFF_ROLE_LABELS } from '../_constants/labels';

type CrmAccountLink = NonNullable<GetCrmInstructorsByIdResponse['data']['crm_account_link']>;

export function InstructorCrmLinkCard({
  crmAccountLink,
}: {
  crmAccountLink: CrmAccountLink | null;
}) {
  // FR-008: this field is optional — render nothing when the instructor has no link.
  if (!crmAccountLink) {
    return null;
  }

  return (
    <Card>
      <CardContent className="px-4">
        <h2 className="mb-3 text-sm font-bold">CRMアカウント紐づけ</h2>
        <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
          <Link className="text-muted-foreground size-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{crmAccountLink.staff_name}</p>
            <p className="text-muted-foreground text-xs">
              {crmAccountLink.staff_id} ·{' '}
              {STAFF_ROLE_LABELS[crmAccountLink.staff_role] ?? crmAccountLink.staff_role}
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
            紐づけ済み
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
