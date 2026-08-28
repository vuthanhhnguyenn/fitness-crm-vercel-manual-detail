'use client';

import { type ClipboardEvent } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { Plus, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { StaffCreateFormValues } from '../_schemas/staff-create.schema';
import {
  buildPastedRows,
  getRowDuplicateStatus,
  parsePastedEmailLines,
} from '../_utils/staff-create.util';

interface StaffRowsSectionProps {
  existingEmails: Set<string>;
}

export function StaffRowsSection({ existingEmails }: StaffRowsSectionProps) {
  const form = useFormContext<StaffCreateFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'rows',
  });
  const rows = useWatch({ control: form.control, name: 'rows' });
  const filledRowCount = rows.filter(
    (row) => row.last_name.trim() || row.first_name.trim() || row.email.trim(),
  ).length;

  function handleAddRow() {
    append({ last_name: '', first_name: '', email: '' });
  }

  function handleRemoveRow(index: number) {
    remove(index);
  }

  function handleEmailPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const emailLines = parsePastedEmailLines(event.clipboardData.getData('text'));
    if (emailLines.length <= 1) return;
    event.preventDefault();
    replace(buildPastedRows(form.getValues('rows'), index, emailLines));
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
          {filledRowCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filledRowCount}名入力中
            </Badge>
          )}
        </div>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[160px] text-xs font-semibold first:pl-4">
              姓<span className="text-destructive ml-0.5">*</span>
            </TableHead>
            <TableHead className="w-[160px] text-xs font-semibold">
              名<span className="text-destructive ml-0.5">*</span>
            </TableHead>
            <TableHead className="text-xs font-semibold">
              メールアドレス<span className="text-destructive ml-0.5">*</span>
            </TableHead>
            <TableHead className="w-10 text-xs font-semibold last:pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => {
            const dup = getRowDuplicateStatus(rows, existingEmails, index);
            const rowErrors = form.formState.errors.rows?.[index];
            return (
              <TableRow key={field.id}>
                <TableCell className="py-2 first:pl-4">
                  <Input
                    placeholder="例: 田中"
                    className="h-8 text-sm"
                    maxLength={255}
                    aria-invalid={!!rowErrors?.last_name}
                    {...form.register(`rows.${index}.last_name`)}
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    placeholder="例: 太郎"
                    className="h-8 text-sm"
                    maxLength={255}
                    aria-invalid={!!rowErrors?.first_name}
                    {...form.register(`rows.${index}.first_name`)}
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    type="email"
                    placeholder="例: tanaka@joyfit.co.jp"
                    className="h-8 text-sm"
                    aria-invalid={!!rowErrors?.email || dup !== null}
                    onPaste={(e) => handleEmailPaste(index, e)}
                    {...form.register(`rows.${index}.email`)}
                  />
                  {dup === 'existing' && (
                    <p className="text-destructive mt-1 text-xs">
                      このメールアドレスはすでに登録されています
                    </p>
                  )}
                  {dup === 'batch' && (
                    <p className="text-destructive mt-1 text-xs">
                      リスト内でメールアドレスが重複しています
                    </p>
                  )}
                </TableCell>
                <TableCell className="py-2 last:pr-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    disabled={fields.length === 1}
                    onClick={() => handleRemoveRow(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 text-sm"
          onClick={handleAddRow}
        >
          <Plus className="size-4" />
          スタッフを追加
        </Button>
      </div>
    </Card>
  );
}
