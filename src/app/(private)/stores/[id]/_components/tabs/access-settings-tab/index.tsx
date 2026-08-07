'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getCrmStoresByIdAccessSettingsOptions,
  getCrmStoresByIdAccessSettingsQueryKey,
  putCrmStoresByIdAccessSettingsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetStoreAccessSettingsResponse,
  JoyUsageFee,
  PermittedStore,
} from '@/lib/api/types.gen';
import { StoreListBrand } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { STORE_BRAND_LABELS } from '../../../../_constants/constants';

type UiSettings = Pick<
  GetStoreAccessSettingsResponse,
  'mutual_use_enabled' | 'start_date' | 'end_date' | 'under18_start_time' | 'under18_end_time'
>;

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function parseDisplayDate(value: string): Date | undefined {
  if (!value) return undefined;
  const normalized = value.replaceAll('/', '-');
  const date = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildTimeOptions() {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    options.push(`${String(hour).padStart(2, '0')}:00`);
    options.push(`${String(hour).padStart(2, '0')}:30`);
  }
  return options;
}

const timeOptions = buildTimeOptions();

export function AccessSettingsTab({ storeId }: Readonly<{ storeId: string }>) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmStoresByIdAccessSettingsOptions({ path: { id: storeId } }),
    enabled: Boolean(storeId),
  });

  const display = useMemo(() => data ?? null, [data]);

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<UiSettings | null>(null);
  const [draftPermittedStores, setDraftPermittedStores] = useState<PermittedStore[]>([]);
  const [fees, setFees] = useState<JoyUsageFee[]>([]);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);

  const saveMutation = useMutation({
    ...putCrmStoresByIdAccessSettingsMutation(),
    onSuccess: async (res) => {
      setIsEditingSettings(false);
      setDraftSettings(null);
      setEditingFeeId(null);
      toast.success(res.message || '保存しました');
      await queryClient.invalidateQueries({
        queryKey: getCrmStoresByIdAccessSettingsQueryKey({ path: { id: storeId } }),
      });
    },
    onError: () => {
      toast.error('入退室設定の更新に失敗しました');
    },
  });

  const clonePermittedRows = (rows: PermittedStore[]) => rows.map((row) => ({ ...row }));

  const handleStartEditSettings = useCallback(() => {
    if (!display) return;
    setDraftSettings({
      mutual_use_enabled: display.mutual_use_enabled,
      start_date: display.start_date,
      end_date: display.end_date,
      under18_start_time: display.under18_start_time,
      under18_end_time: display.under18_end_time,
    });
    setDraftPermittedStores(clonePermittedRows(display.permitted_stores));
    setFees(display.joy_usage_fees.map((f) => ({ ...f })));
    setIsEditingSettings(true);
  }, [display]);

  const handleCancelEditSettings = () => {
    setDraftSettings(null);
    setDraftPermittedStores([]);
    setFees(display?.joy_usage_fees.map((f) => ({ ...f })) ?? []);
    setIsEditingSettings(false);
    setEditingFeeId(null);
  };

  const handleSaveSettings = () => {
    if (!draftSettings) return;
    saveMutation.mutate({
      path: { id: storeId },
      body: {
        mutual_use_enabled: draftSettings.mutual_use_enabled,
        start_date: draftSettings.start_date,
        end_date: draftSettings.end_date,
        under18_start_time: draftSettings.under18_start_time,
        under18_end_time: draftSettings.under18_end_time,
        permitted_stores: draftPermittedStores.map((r) => ({
          id: r.id,
          store_name: r.store_name,
          brand: r.brand,
          setup_date: r.setup_date,
        })),
        joy_usage_fees: fees.map((f) => ({
          id: f.id,
          option_name: f.option_name,
          fee: f.fee,
        })),
      },
    });
  };

  const handleUpdatePermittedRow = (
    id: string,
    field: keyof Pick<PermittedStore, 'store_name' | 'brand' | 'setup_date'>,
    value: string,
  ) => {
    setDraftPermittedStores((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        return { ...row, [field]: field === 'brand' ? (value as StoreListBrand) : value };
      }),
    );
  };

  const handleAddPermittedRow = () => {
    const id = `g-${Date.now()}`;
    setDraftPermittedStores((prev) => [
      ...prev,
      {
        id,
        store_name: '',
        brand: StoreListBrand.JOYFIT24,
        setup_date: format(new Date(), 'yyyy/MM/dd'),
      },
    ]);
  };

  const handleDeletePermittedRow = (id: string) => {
    setDraftPermittedStores((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddFeeRow = () => {
    if (!isEditingSettings) return;
    const id = `fee-${Date.now()}`;
    setFees((prev) => [...prev, { id, option_name: '', fee: 0 }]);
    setEditingFeeId(id);
  };

  const handleEditFeeField = (id: string, field: 'option_name' | 'fee', value: string) => {
    setFees((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'fee' ? Number(value.replaceAll(',', '') || 0) : value,
            }
          : item,
      ),
    );
  };

  const handleDeleteFee = (id: string) => {
    setFees((prev) => prev.filter((item) => item.id !== id));
    if (editingFeeId === id) {
      setEditingFeeId(null);
    }
  };

  if (!storeId) {
    return null;
  }

  if (isLoading || isError || !data) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorTitle="入退室設定の取得に失敗しました"
      />
    );
  }

  const view = display!;
  const editSettings = isEditingSettings && draftSettings ? draftSettings : view;
  const editPermitted = isEditingSettings ? draftPermittedStores : view.permitted_stores;
  const showFees = isEditingSettings ? fees : view.joy_usage_fees;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="sticky top-0 z-10 flex items-center justify-end gap-2 bg-neutral-50 pb-1">
        {isEditingSettings ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEditSettings}
              disabled={saveMutation.isPending}
            >
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSaveSettings} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? '保存中…' : '保存'}
            </Button>
          </>
        ) : (
          <RoleGatedButton
            requiredPermission={Permission.StoresConfigAccess}
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleStartEditSettings}
          >
            <Pencil className="size-3.5" />
            編集
          </RoleGatedButton>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b p-4 pb-2!">
            <CardTitle className="text-base">相互利用設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">相互利用</p>
                <p className="text-muted-foreground text-xs">他店舗会員の受入を許可する</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs">{editSettings.mutual_use_enabled ? '受入可' : '受入不可'}</p>
                <Switch
                  checked={editSettings.mutual_use_enabled}
                  disabled={!isEditingSettings}
                  onCheckedChange={(checked) =>
                    setDraftSettings((prev) => {
                      if (!prev) return prev;
                      return { ...prev, mutual_use_enabled: Boolean(checked) };
                    })
                  }
                  aria-label="相互利用設定"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isEditingSettings && draftSettings ? (
                <>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs">相互利用受入可能期間（開始日）</p>
                    <DatePicker
                      date={parseDisplayDate(draftSettings.start_date)}
                      onDateChange={(date) =>
                        setDraftSettings((prev) => {
                          if (!prev) return prev;
                          return { ...prev, start_date: date ? format(date, 'yyyy/MM/dd') : '' };
                        })
                      }
                      placeholder="日付を選択"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs">相互利用受入可能期間（終了日）</p>
                    <DatePicker
                      date={parseDisplayDate(draftSettings.end_date)}
                      onDateChange={(date) =>
                        setDraftSettings((prev) => {
                          if (!prev) return prev;
                          return { ...prev, end_date: date ? format(date, 'yyyy/MM/dd') : '' };
                        })
                      }
                      placeholder="日付を選択"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs">18歳未満入館可能時間（開始）</p>
                    <Select
                      value={draftSettings.under18_start_time ?? ''}
                      onValueChange={(value) =>
                        setDraftSettings((prev) => {
                          if (!prev) return prev;
                          const finalValue = value ?? '';
                          return { ...prev, under18_start_time: finalValue };
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs">18歳未満入館可能時間（終了）</p>
                    <Select
                      value={draftSettings.under18_end_time ?? ''}
                      onValueChange={(value) =>
                        setDraftSettings((prev) => {
                          if (!prev) return prev;
                          const finalValue = value ?? '';
                          return { ...prev, under18_end_time: finalValue };
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="時間を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <InfoItem label="相互利用受入可能期間（開始日）" value={view.start_date} />
                  <InfoItem label="相互利用受入可能期間（終了日）" value={view.end_date} />
                  <InfoItem label="18歳未満入館可能時間（開始）" value={view.under18_start_time} />
                  <InfoItem label="18歳未満入館可能時間（終了）" value={view.under18_end_time} />
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">相互利用グループ（許可店舗）</p>

                  <Badge variant="secondary" className="text-[10px]">
                    {editPermitted.length}店舗
                  </Badge>
                </div>
                {isEditingSettings && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={handleAddPermittedRow}
                  >
                    <Plus className="size-3.5" />
                    行追加
                  </Button>
                )}
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>店舗名</TableHead>
                      <TableHead>ブランド</TableHead>
                      <TableHead>設定日</TableHead>
                      {isEditingSettings && <TableHead className="w-16 text-right">操作</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editPermitted.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isEditingSettings ? 4 : 3}
                          className="text-muted-foreground py-6 text-center text-sm"
                        >
                          データなし
                        </TableCell>
                      </TableRow>
                    ) : (
                      editPermitted.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            {isEditingSettings ? (
                              <Input
                                value={row.store_name}
                                onChange={(e) =>
                                  handleUpdatePermittedRow(row.id, 'store_name', e.target.value)
                                }
                                placeholder="店舗名を入力"
                              />
                            ) : (
                              row.store_name || '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditingSettings ? (
                              <Select
                                value={row.brand}
                                onValueChange={(value) =>
                                  handleUpdatePermittedRow(row.id, 'brand', value ?? row.brand)
                                }
                                items={STORE_BRAND_LABELS}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="ブランドを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(StoreListBrand).map((brand) => (
                                    <SelectItem key={brand} value={brand}>
                                      {STORE_BRAND_LABELS[brand]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              STORE_BRAND_LABELS[row.brand]
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditingSettings ? (
                              <DatePicker
                                date={parseDisplayDate(row.setup_date)}
                                onDateChange={(date) =>
                                  handleUpdatePermittedRow(
                                    row.id,
                                    'setup_date',
                                    date ? format(date, 'yyyy/MM/dd') : '',
                                  )
                                }
                                placeholder="日付を選択"
                              />
                            ) : (
                              row.setup_date || '—'
                            )}
                          </TableCell>
                          {isEditingSettings && (
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="行を削除"
                                onClick={() => handleDeletePermittedRow(row.id)}
                              >
                                <Trash2 className="text-destructive size-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="p-4 pb-2!">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">どこでもJOY利用料金</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {showFees.length}件
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleAddFeeRow}
                disabled={!isEditingSettings || saveMutation.isPending}
              >
                <Plus className="size-3.5" />
                行追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">オプション名</TableHead>
                  <TableHead className="text-right">料金（税込）</TableHead>
                  <TableHead className="w-28 pr-4 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showFees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground py-6 text-center text-sm"
                    >
                      データなし
                    </TableCell>
                  </TableRow>
                ) : (
                  showFees.map((fee) => {
                    const isEditingRow = editingFeeId === fee.id && isEditingSettings;
                    return (
                      <TableRow key={fee.id}>
                        <TableCell className="pl-4">
                          {isEditingRow ? (
                            <Input
                              value={fee.option_name}
                              onChange={(e) =>
                                handleEditFeeField(fee.id, 'option_name', e.target.value)
                              }
                              placeholder="オプション名を入力"
                            />
                          ) : (
                            fee.option_name || '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditingRow ? (
                            <Input
                              className="ml-auto max-w-32 text-right"
                              value={fee.fee}
                              onChange={(e) => handleEditFeeField(fee.id, 'fee', e.target.value)}
                              inputMode="numeric"
                            />
                          ) : (
                            `${fee.fee.toLocaleString()}円`
                          )}
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-end gap-1">
                            {isEditingSettings &&
                              (isEditingRow ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => setEditingFeeId(null)}
                                >
                                  <Check className="size-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label="編集"
                                  onClick={() => setEditingFeeId(fee.id)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              ))}
                            {isEditingSettings && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="削除"
                                onClick={() => handleDeleteFee(fee.id)}
                              >
                                <Trash2 className="text-destructive size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
