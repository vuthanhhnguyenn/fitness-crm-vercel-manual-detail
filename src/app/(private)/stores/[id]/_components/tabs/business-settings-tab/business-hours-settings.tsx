'use client';

import { useEffect, useState } from 'react';

import { Clock3, Pencil } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { PatchCrmStoresByIdBusinessHoursData } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { type BusinessHours, DAY_LABELS, DAY_ORDER } from './business-hours-shared';

export type BusinessHoursPatchVars = {
  path: { id: string };
  body: NonNullable<PatchCrmStoresByIdBusinessHoursData['body']>;
};

type Props = {
  storeId: string;
  serverBusinessHours: BusinessHours;
  mutate: (vars: BusinessHoursPatchVars, opts?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  onPreviewChange: (draft: BusinessHours['default_hours'] | null) => void;
};

export function BusinessHoursSettings({
  storeId,
  serverBusinessHours,
  mutate,
  isPending,
  onPreviewChange,
}: Props) {
  const [editingDefaults, setEditingDefaults] = useState(false);
  const [draftDefaults, setDraftDefaults] = useState<BusinessHours['default_hours'] | null>(null);

  useEffect(() => {
    onPreviewChange(editingDefaults && draftDefaults ? draftDefaults : null);
  }, [editingDefaults, draftDefaults, onPreviewChange]);

  const startEdit = () => {
    setDraftDefaults(serverBusinessHours.default_hours.map((item) => ({ ...item })));
    setEditingDefaults(true);
  };

  const cancelEdit = () => {
    setDraftDefaults(null);
    setEditingDefaults(false);
  };

  const saveEdit = () => {
    if (!draftDefaults) return;
    mutate(
      {
        path: { id: storeId },
        body: {
          default_hours: draftDefaults,
          exception_hours: serverBusinessHours.exception_hours,
          temporary_closures: serverBusinessHours.temporary_closures,
        },
      },
      {
        onSuccess: () => {
          setDraftDefaults(null);
          setEditingDefaults(false);
        },
      },
    );
  };

  const setDefaultHoursValue = (
    day: (typeof DAY_ORDER)[number],
    field: 'open_time' | 'close_time' | 'is_closed',
    value: string | boolean,
  ) => {
    setDraftDefaults((prev) => {
      if (!prev) return prev;
      return prev.map((item) => {
        if (item.day !== day) return item;
        if (field === 'is_closed') {
          return { ...item, is_closed: Boolean(value) };
        }
        return { ...item, [field]: String(value) };
      });
    });
  };

  const displayDefaults = draftDefaults ?? serverBusinessHours.default_hours;

  return (
    <>
      <CardHeader className="gap-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">営業時間設定</CardTitle>
          {editingDefaults ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                キャンセル
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={isPending}>
                {isPending ? '保存中...' : '保存'}
              </Button>
            </div>
          ) : (
            <RoleGatedButton
              requiredPermission={Permission.StoresConfigBusiness}
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={startEdit}
            >
              <Pencil className="size-3" />
              編集
            </RoleGatedButton>
          )}
        </div>
      </CardHeader>

      <div className="flex flex-col gap-3 px-4">
        {DAY_ORDER.map((day) => {
          const row = displayDefaults.find((entry) => entry.day === day);
          if (!row) return null;

          return (
            <div key={day} className="flex items-center justify-between gap-2">
              <span className="w-12 text-xs font-medium">{DAY_LABELS[day]}</span>
              <div className="flex items-center gap-1">
                <Clock3 className="text-muted-foreground size-3" />
                {editingDefaults ? (
                  <>
                    <Input
                      type="time"
                      className="h-7 w-24 text-xs"
                      value={row.open_time}
                      disabled={row.is_closed}
                      onChange={(event) =>
                        setDefaultHoursValue(day, 'open_time', event.target.value)
                      }
                    />
                    <span className="text-muted-foreground text-xs">〜</span>
                    <Input
                      type="time"
                      className="h-7 w-24 text-xs"
                      value={row.close_time}
                      disabled={row.is_closed}
                      onChange={(event) =>
                        setDefaultHoursValue(day, 'close_time', event.target.value)
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={row.is_closed ? 'default' : 'outline'}
                      className="h-7 text-[10px]"
                      onClick={() =>
                        setDefaultHoursValue(day, 'is_closed', !Boolean(row.is_closed))
                      }
                    >
                      休業
                    </Button>
                  </>
                ) : row.is_closed ? (
                  <span className="text-muted-foreground text-xs">休業</span>
                ) : (
                  <>
                    <span className="text-xs">{row.open_time}</span>
                    <span className="text-muted-foreground text-xs">〜</span>
                    <span className="text-xs">{row.close_time}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
