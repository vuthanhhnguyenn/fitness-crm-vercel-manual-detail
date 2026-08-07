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

export type ExceptionHoursSettingsHandle = {
  clearRowEdit: () => void;
};

type Props = {
  storeId: string;
  serverBusinessHours: BusinessHours;
  mutate: (vars: BusinessHoursPatchVars, opts?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  onPreviewChange: (draft: BusinessHours['exception_hours'] | null) => void;
  onInteraction?: () => void;
};

export const ExceptionHoursSettings = forwardRef<ExceptionHoursSettingsHandle, Props>(
  function ExceptionHoursSettings(
    { storeId, serverBusinessHours, mutate, isPending, onPreviewChange, onInteraction },
    ref,
  ) {
    const [draft, setDraft] = useState<BusinessHours['exception_hours'] | null>(null);
    const [editingExceptionId, setEditingExceptionId] = useState<string | null>(null);

    useEffect(() => {
      onPreviewChange(draft);
    }, [draft, onPreviewChange]);

    const clearRowEdit = useCallback(() => {
      setEditingExceptionId(null);
    }, []);

    useImperativeHandle(ref, () => ({ clearRowEdit }), [clearRowEdit]);

    const updateDraft = (
      updater: (list: BusinessHours['exception_hours']) => BusinessHours['exception_hours'],
    ) => {
      setDraft((prev) => {
        const base = prev ?? serverBusinessHours.exception_hours.map((item) => ({ ...item }));
        return updater(base);
      });
    };

    const addException = () => {
      onInteraction?.();
      const newId = crypto.randomUUID();
      setDraft((prev) => {
        const base = prev ?? serverBusinessHours.exception_hours.map((item) => ({ ...item }));
        return [
          ...base,
          {
            id: newId,
            date: toInputDate(new Date()),
            open_time: '10:00',
            close_time: '18:00',
          },
        ];
      });
      setEditingExceptionId(newId);
    };

    const startEdit = (exceptionId: string) => {
      onInteraction?.();
      setDraft((prev) => prev ?? serverBusinessHours.exception_hours.map((item) => ({ ...item })));
      setEditingExceptionId(exceptionId);
    };

    const cancelRow = (entryId: string) => {
      setDraft((prev) => {
        const list = prev ?? serverBusinessHours.exception_hours.map((item) => ({ ...item }));
        const serverRow = serverBusinessHours.exception_hours.find((e) => e.id === entryId);
        if (serverRow) {
          return list.map((item) => (item.id === entryId ? { ...serverRow } : item));
        }
        return list.filter((item) => item.id !== entryId);
      });
      setEditingExceptionId(null);
    };

    const saveRow = () => {
      const exception_hours = draft ?? serverBusinessHours.exception_hours;
      mutate(
        {
          path: { id: storeId },
          body: {
            default_hours: serverBusinessHours.default_hours,
            exception_hours,
            temporary_closures: serverBusinessHours.temporary_closures,
          },
        },
        {
          onSuccess: () => {
            setDraft(null);
            setEditingExceptionId(null);
          },
        },
      );
    };

    const deleteEntry = (entryId: string) => {
      const current = draft ?? serverBusinessHours.exception_hours.map((item) => ({ ...item }));
      const next = current.filter((item) => item.id !== entryId);
      mutate(
        {
          path: { id: storeId },
          body: {
            default_hours: serverBusinessHours.default_hours,
            exception_hours: next,
            temporary_closures: serverBusinessHours.temporary_closures,
          },
        },
        {
          onSuccess: () => {
            setDraft(null);
            setEditingExceptionId((id) => (id === entryId ? null : id));
          },
        },
      );
    };

    const entries = draft ?? serverBusinessHours.exception_hours;

    return (
      <div className="border-t px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium">例外営業時間設定</p>
          <RoleGatedButton
            requiredPermission={Permission.StoresConfigBusiness}
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={addException}
          >
            <Plus className="size-3" />
            日付追加
          </RoleGatedButton>
        </div>
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isItemEditing = editingExceptionId === entry.id;
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
                    <>
                      <Input
                        type="time"
                        className="h-7 w-24 text-xs"
                        value={entry.open_time}
                        onChange={(event) =>
                          updateDraft((base) =>
                            base.map((item) =>
                              item.id === entry.id
                                ? { ...item, open_time: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <span className="text-muted-foreground text-xs">〜</span>
                      <Input
                        type="time"
                        className="h-7 w-24 text-xs"
                        value={entry.close_time}
                        onChange={(event) =>
                          updateDraft((base) =>
                            base.map((item) =>
                              item.id === entry.id
                                ? { ...item, close_time: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </>
                  ) : (
                    <span className="text-xs">
                      {entry.open_time} 〜 {entry.close_time}
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

ExceptionHoursSettings.displayName = 'ExceptionHoursSettings';
