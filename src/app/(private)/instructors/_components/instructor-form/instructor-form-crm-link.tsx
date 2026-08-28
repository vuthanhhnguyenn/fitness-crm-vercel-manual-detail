'use client';

import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel } from '@/components/ui/form';

import { getCrmStaffsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { StaffListItem } from '@/lib/api/types.gen';

import type { InstructorFormValues } from '../instructor-form.schema';

export function InstructorFormCrmLink() {
  const form = useFormContext<InstructorFormValues>();
  const staffId = useWatch({ control: form.control, name: 'crmAccountLinkStaffId' });
  const staffName = useWatch({ control: form.control, name: 'crmAccountLinkStaffName' });
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery(
    getCrmStaffsOptions({ query: { search: search || undefined, limit: 20 } }),
  );
  const staffs = data?.staffs ?? [];

  const handleSelect = (staff: StaffListItem | null) => {
    // Re-selecting the currently linked staff toggles the link off.
    const next = staff && staff.staff_id === staffId ? null : staff;
    form.setValue('crmAccountLinkStaffId', next?.staff_id ?? null, { shouldDirty: true });
    form.setValue('crmAccountLinkStaffName', next?.name ?? null, { shouldDirty: true });
  };

  return (
    <>
      <h2 className="mb-1 text-base font-bold">CRMアカウント紐づけ</h2>
      <p className="text-muted-foreground mb-4 text-xs">
        スタッフマスタから選択します（任意）。紐づけしない場合は空欄のままにしてください。
      </p>
      <FormItem>
        <FormLabel className="text-sm font-medium">スタッフアカウント</FormLabel>
        <SearchableSelect
          value={staffId ?? null}
          valueLabel={staffId && staffName ? `${staffName} (${staffId})` : undefined}
          options={staffs}
          placeholder="スタッフを検索して選択"
          searchPlaceholder="氏名・IDで検索..."
          emptyMessage="該当するスタッフがありません"
          loadingMessage="検索中..."
          isLoading={isLoading}
          onSearchChange={setSearch}
          onSelect={handleSelect}
          getOptionKey={(staff) => staff.staff_id}
          getOptionLabel={(staff) => `${staff.name} (${staff.staff_id})`}
          triggerClassName="w-full"
        />
        {staffId && staffName && (
          <Badge variant="secondary" className="w-fit gap-1 py-1.5 pr-1 pl-2.5 text-xs font-normal">
            {staffName} ({staffId})
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-4 hover:bg-transparent"
              onClick={() => handleSelect(null)}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        )}
      </FormItem>
    </>
  );
}
