'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';

import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Permission } from '@/types/permission.type';

import type { BusinessHoursPatchVars } from './business-hours-settings';
import type { BusinessHours } from './business-hours-shared';
import { toDisplayDate, toInputDate } from './business-hours-shared';

export type TemporaryClosureDaysSettingsHandle = {
  clearRowEdit: () => void;
};

type Props = {
  storeId: string;
  serverBusinessHours: BusinessHours;
  mutate: (vars: BusinessHoursPatchVars, opts?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  onPreviewChange: (draft: BusinessHours['temporary_closures'] | null) => void;
  onInteraction?: () => void;
};

export const TemporaryClosureDaysSettings = forwardRef<TemporaryClosureDaysSettingsHandle, Props>(
  function TemporaryClosureDaysSettings(
    { storeId, serverBusinessHours, mutate, isPending, onPreviewChange, onInteraction },
    ref,
  ) {
    const [draft, setDraft] = useState<BusinessHours['temporary_closures'] | null>(null);
    const [editingClosureId, setEditingClosureId] = useState<string | null>(null);

    useEffect(() => {
      onPreviewChange(draft);
    }, [draft, onPreviewChange]);

    const clearRowEdit = useCallback(() => {
      setEditingClosureId(null);
    }, []);

    useImperativeHandle(ref, () => ({ clearRowEdit }), [clearRowEdit]);

    const updateDraft = (
      updater: (list: BusinessHours['temporary_closures']) => BusinessHours['temporary_closures'],
    ) => {
      setDraft((prev) => {
        const base = prev ?? serverBusinessHours.temporary_closures.map((item) => ({ ...item }));
        return updater(base);
      });
    };

    const addClosure = () => {
      onInteraction?.();
      const newId = crypto.randomUUID();
      setDraft((prev) => {
        const base = prev ?? serverBusinessHours.temporary_closures.map((item) => ({ ...item }));
        return [
          ...base,
          {
            id: newId,
            date: toInputDate(new Date()),
            reason: '',
          },
        ];
      });
      setEditingClosureId(newId);
    };

    const startEdit = (closureId: string) => {
      onInteraction?.();
      setDraft(
        (prev) => prev ?? serverBusinessHours.temporary_closures.map((item) => ({ ...item })),
      );
      setEditingClosureId(closureId);
    };

    const cancelRow = (entryId: string) => {
      setDraft((prev) => {
        const list = prev ?? serverBusinessHours.temporary_closures.map((item) => ({ ...item }));
        const serverRow = serverBusinessHours.temporary_closures.find((e) => e.id === entryId);
        if (serverRow) {
          return list.map((item) => (item.id === entryId ? { ...serverRow } : item));
        }
        return list.filter((item) => item.id !== entryId);
      });
      setEditingClosureId(null);
    };

    const saveRow = () => {
      const temporary_closures = draft ?? serverBusinessHours.temporary_closures;
      mutate(
        {
          path: { id: storeId },
          body: {
            default_hours: serverBusinessHours.default_hours,
            exception_hours: serverBusinessHours.exception_hours,
            temporary_closures,
          },
        },
        {
          onSuccess: () => {
            setDraft(null);
            setEditingClosureId(null);
          },
        },
      );
    };

    const deleteEntry = (entryId: string) => {
      const current = draft ?? serverBusinessHours.temporary_closures.map((item) => ({ ...item }));
      const next = current.filter((item) => item.id !== entryId);
      mutate(
        {
          path: { id: storeId },
          body: {
            default_hours: serverBusinessHours.default_hours,
            exception_hours: serverBusinessHours.exception_hours,
            temporary_closures: next,
          },
        },
        {
          onSuccess: () => {
            setDraft(null);
            setEditingClosureId((id) => (id === entryId ? null : id));
          },
        },
      );
    };

    const entries = draft ?? serverBusinessHours.temporary_closures;

    return (
      <div className="border-t px-4 pt-4 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium">臨時休業日</p>

          <RoleGatedButton
            requiredPermission={Permission.StoresConfigBusiness}
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={addClosure}
          >
            <Plus className="size-3" />
            日付追加
          </RoleGatedButton>
        </div>
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isItemEditing = editingClosureId === entry.id;
            return (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarDays className="text-muted-foreground size-3 shrink-0" />
                  {isItemEditing ? (
                    <Input
                      type="date"
                      className="h-7 w-36 text-xs"
                      value={entry.date}
                      onChange={(event) =>
                        updateDraft((base) =>
                          base.map((item) =>
                            item.id === entry.id ? { ...item, date: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  ) : (
                    <span className="text-xs">{toDisplayDate(entry.date)}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isItemEditing ? (
                    <Input
                      type="text"
                      className="h-7 w-36 text-xs"
                      placeholder="理由"
                      value={entry.reason ?? ''}
                      onChange={(event) =>
                        updateDraft((base) =>
                          base.map((item) =>
                            item.id === entry.id ? { ...item, reason: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  ) : (
                    <span
                      className="text-muted-foreground max-w-36 truncate text-xs"
                      title={entry.reason || '-'}
                    >
                      {entry.reason || '-'}
                    </span>
                  )}
                  {isItemEditing ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => cancelRow(entry.id)}
                        disabled={isPending}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={saveRow}
                        disabled={isPending}
                      >
                        {isPending ? '保存中...' : '保存'}
                      </Button>
                    </div>
                  ) : (
                    <RoleGatedButton
                      requiredPermission={Permission.StoresConfigBusiness}
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      onClick={() => startEdit(entry.id)}
                    >
                      <Pencil className="size-3" />
                    </RoleGatedButton>
                  )}

                  <RoleGatedButton
                    requiredPermission={Permission.StoresConfigBusiness}
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={() => deleteEntry(entry.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="text-destructive size-3" />
                  </RoleGatedButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

TemporaryClosureDaysSettings.displayName = 'TemporaryClosureDaysSettings';
