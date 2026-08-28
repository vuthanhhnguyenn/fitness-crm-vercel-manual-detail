'use client';

import { type UseFormReturn, useFormContext, useWatch } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';
import { useQuery } from '@tanstack/react-query';

import { FormField } from '@/components/common/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmPositionsOptions } from '@/lib/api/@tanstack/react-query.gen';

import { STAFF_ROLE_LABELS, StaffRole } from '../../_constants/constants';
import type { StaffCreateFormValues } from '../_schemas/staff-create.schema';

const CREATABLE_ROLES = (Object.values(StaffRole) as StaffRole[]).filter(
  (role) => role !== StaffRole.SYSTEM,
);

function handleRoleChange(form: UseFormReturn<StaffCreateFormValues>, value: string) {
  form.setValue('role', value as StaffCreateFormValues['role'], { shouldDirty: true });
  form.setValue('position_id', undefined, { shouldDirty: true });
}

function handlePositionChange(form: UseFormReturn<StaffCreateFormValues>, value: string | null) {
  const id = Number.parseInt(value ?? '', 10);
  form.setValue('position_id', Number.isNaN(id) ? undefined : id, { shouldDirty: true });
}

export function PermissionSection() {
  const form = useFormContext<StaffCreateFormValues>();
  const role = useWatch({ control: form.control, name: 'role' });
  const positionId = useWatch({ control: form.control, name: 'position_id' });

  const { data: positionsRes, isLoading: positionsLoading } = useQuery(getCrmPositionsOptions());
  const positions = (positionsRes?.items ?? []).filter((p) => p.role === role);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">権限設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            label="ロール"
            required
            description="ロールによって利用できる機能の範囲が決まります"
            error={form.formState.errors.role?.message}
          >
            <Select
              value={role ?? ''}
              onValueChange={(value) => handleRoleChange(form, value ?? '')}
              items={toSelectItems(
                CREATABLE_ROLES.map((r) => ({ value: r, label: STAFF_ROLE_LABELS[r] })),
              )}
            >
              <SelectTrigger className="max-w-[280px]">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {CREATABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {STAFF_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="職位" description="ロール内の権限粒度を職位マスターで設定します">
            <Select
              value={positionId != null ? String(positionId) : ''}
              onValueChange={(value) => handlePositionChange(form, value)}
              disabled={!role}
              items={toSelectItems(
                positions.map((p) => ({ value: String(p.id), label: p.position_name })),
              )}
            >
              <SelectTrigger className="max-w-[280px]">
                <SelectValue
                  placeholder={
                    !role
                      ? '先にロールを選択してください'
                      : positionsLoading
                        ? '読み込み中…'
                        : '職位を選択'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.position_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
