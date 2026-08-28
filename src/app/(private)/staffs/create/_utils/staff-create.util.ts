import type { PostCrmStaffsData } from '@/lib/api/types.gen';

import { type StaffCreateFormValues, isRowFilled } from '../_schemas/staff-create.schema';

export type DuplicateStatus = 'existing' | 'batch' | null;

export function getRowDuplicateStatus(
  rows: StaffCreateFormValues['rows'],
  existingEmails: Set<string>,
  index: number,
): DuplicateStatus {
  const email = rows[index]?.email.trim().toLowerCase();
  if (!email) return null;
  if (existingEmails.has(email)) return 'existing';
  if (rows.some((r, i) => i !== index && r.email.trim().toLowerCase() === email)) return 'batch';
  return null;
}

export function hasAnyDuplicate(
  rows: StaffCreateFormValues['rows'],
  existingEmails: Set<string>,
): boolean {
  return rows.some(
    (row, i) => isRowFilled(row) && getRowDuplicateStatus(rows, existingEmails, i) !== null,
  );
}

export function parsePastedEmailLines(pasted: string): string[] {
  return pasted
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function buildPastedRows(
  currentRows: StaffCreateFormValues['rows'],
  index: number,
  emailLines: string[],
): StaffCreateFormValues['rows'] {
  const before = currentRows.slice(0, index);
  const after = currentRows.slice(index + 1);
  const current = currentRows[index];
  const newRows = emailLines.map((email, i) => ({
    last_name: i === 0 ? (current?.last_name ?? '') : '',
    first_name: i === 0 ? (current?.first_name ?? '') : '',
    email,
  }));
  return [...before, ...newRows, ...after];
}

function buildStaffLinkage(
  values: StaffCreateFormValues,
  stores: Array<{ id: string; name: string }>,
  selectedFc: { display_name: string } | undefined,
): NonNullable<PostCrmStaffsData['body']>['staff_linkage'] {
  if (values.affiliation_type === 'direct_store') {
    if (!values.store_id) return undefined;
    return {
      type: 'direct_store',
      store_id: values.store_id,
      store_name: stores.find((s) => s.id === values.store_id)?.name,
    };
  }
  if (!values.fc_company_id) return undefined;
  return {
    type: 'fc_company',
    fc_company_id: values.fc_company_id,
    fc_company_name: selectedFc?.display_name,
  };
}

export function buildCreateStaffPayload(
  values: StaffCreateFormValues,
  stores: Array<{ id: string; name: string }>,
  selectedFc: { display_name: string } | undefined,
): PostCrmStaffsData['body'] {
  const filledRows = values.rows.filter(isRowFilled);
  return {
    staff: filledRows.map((row) => ({
      last_name: row.last_name.trim(),
      first_name: row.first_name.trim(),
      email: row.email.trim(),
    })),
    role: values.role,
    position_id: values.position_id,
    staff_linkage: buildStaffLinkage(values, stores, selectedFc),
    note: values.note || undefined,
  };
}

export function getSubmitErrorMessage(
  isSubmitted: boolean,
  hasDuplicate: boolean,
  hasFieldErrors: boolean,
): string {
  if (!isSubmitted) return '';
  if (hasDuplicate) return 'メールアドレスが重複しています';
  if (hasFieldErrors) return '未入力の必須項目があります';
  return '';
}
