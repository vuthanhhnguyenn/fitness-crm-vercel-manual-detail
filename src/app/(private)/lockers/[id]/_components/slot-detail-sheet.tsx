'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { LockerPasswordEditor } from '@/app/(private)/lockers/_components/locker-password-editor';
import { useAuthUser } from '@/contexts/auth-user.context';
import { formatDateYYYYMMDD } from '@/utils/date.util';
import { CircleDollarSign, KeyRound, Lock, Unlock, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type {
  GetCrmLockersByIdResponse,
  LockerLockType,
  OptionMasterListItem,
  PatchCrmLockersByIdSlotsBySlotIdData,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  LOCKER_CONTRACT_STATUS_BADGE_CLASSES,
  LOCKER_CONTRACT_STATUS_LABELS,
  LOCKER_LOCK_TYPE_LABELS,
  LOCKER_SLOT_OPEN_TYPE_LABELS,
} from '../../_constants/constants';
import { ReminderNotificationSection } from './reminder-notification-section';
import { SlotSettingDialog } from './slot-setting-dialog';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];
type SlotItem = LockerDetail['slot_items'][number];
type UpdateLockerSlotBody = NonNullable<PatchCrmLockersByIdSlotsBySlotIdData['body']>;

interface SlotContractTypeSectionProps {
  slot: SlotItem;
  lockerOptionMasters: OptionMasterListItem[];
  isUpdating: boolean;
  canAssignContract: boolean;
  onContractTypeSave: (slotId: string, code: string) => void;
}

function SlotContractTypeSection({
  slot,
  lockerOptionMasters,
  isUpdating,
  canAssignContract,
  onContractTypeSave,
}: SlotContractTypeSectionProps) {
  const [selectedContractCode, setSelectedContractCode] = useState(slot.contract_type_code ?? '');
  const currentType = lockerOptionMasters.find((item) => item.code === slot.contract_type_code);
  const isAssigned = Boolean(slot.contract_type_code);

  return (
    <div className="py-4">
      <h3 className="text-muted-foreground mb-3 flex items-center gap-1 text-xs font-semibold">
        <CircleDollarSign className="size-3" />
        G-02 契約種類
      </h3>
      <div className="bg-card flex flex-col gap-3 rounded-lg border p-4">
        {isAssigned && currentType ? (
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">適用中の契約種類</p>
              <p className="text-base font-semibold">{currentType.name}</p>
              <p className="text-muted-foreground mt-0.5 font-mono text-xs">{currentType.code}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">
                ¥{currentType.price_including_tax.toLocaleString()}
                <span className="text-muted-foreground ml-1 text-xs font-normal">/月</span>
              </p>
              <Badge
                variant="outline"
                className="bg-success/15 text-success border-success/20 mt-1 text-[10px] font-medium"
              >
                割当済み
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <CircleDollarSign className="text-muted-foreground size-5" />
            <p className="text-muted-foreground text-center text-xs">
              契約種類が未割当です。
              <br />
              下のセレクトから割り当ててください。
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">
            {isAssigned ? '契約種類を変更' : '契約種類を割り当てる'}
          </p>
          {canAssignContract ? (
            <div className="flex items-center gap-2">
              <Select
                value={selectedContractCode}
                onValueChange={(code) => code && setSelectedContractCode(code)}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="契約種類を選択...">
                    {selectedContractCode
                      ? lockerOptionMasters.find((item) => item.code === selectedContractCode)?.name
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {lockerOptionMasters.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      <span className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          ¥{item.price_including_tax.toLocaleString()}/月
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant={isAssigned ? 'outline' : 'default'}
                className="shrink-0 text-xs"
                disabled={!selectedContractCode || isUpdating}
                onClick={() => onContractTypeSave(slot.id, selectedContractCode)}
              >
                {isAssigned ? '変更' : '割り当て'}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">契約種類の割当権限がありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SlotDetailSheetProps {
  open: boolean;
  onClose: () => void;
  slot: SlotItem | null;
  contractDetailId?: string | null;
  lockerArea: string;
  lockerOptionMasters: OptionMasterListItem[];
  isUpdating?: boolean;
  isSendingReminder?: boolean;
  onContractTypeSave: (slotId: string, code: string) => void;
  onRelease?: (slotNumber: string) => void;
  onUpdateSlot: (slotId: string, body: UpdateLockerSlotBody) => Promise<unknown>;
  onSendReminder: (slotId: string, reminderDays: 7 | 14 | 30) => Promise<unknown>;
}

export function SlotDetailSheet({
  open,
  onClose,
  slot,
  contractDetailId = null,
  lockerArea,
  lockerOptionMasters,
  isUpdating = false,
  isSendingReminder = false,
  onContractTypeSave,
  onRelease,
  onUpdateSlot,
  onSendReminder,
}: SlotDetailSheetProps) {
  const router = useRouter();
  const { hasPermission } = useAuthUser();
  const canEditSlot = hasPermission(Permission.LockersEdit);
  const canAssignContract = hasPermission(Permission.LockersContractsEdit);
  const [editingLockType, setEditingLockType] = useState(false);
  const [selectedLockType, setSelectedLockType] = useState<LockerLockType>('dial');
  const [slotSettingDialogOpen, setSlotSettingDialogOpen] = useState(false);
  const [slotSettingFormKey, setSlotSettingFormKey] = useState(0);

  const hasMember = Boolean(slot?.member_name);
  const isBottomRow = slot?.is_bottom_row ?? false;

  function handleClose() {
    setEditingLockType(false);
    setSlotSettingDialogOpen(false);
    onClose();
  }

  if (!slot) return null;

  const statusLabel = LOCKER_CONTRACT_STATUS_LABELS[slot.status];
  const statusStyle = LOCKER_CONTRACT_STATUS_BADGE_CLASSES[slot.status];

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (!value) handleClose();
        }}
      >
        <SheetContent className="flex w-[480px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]">
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="size-4" />
                スロット {slot.slot_number}
                <Badge variant="outline" className={`gap-1 text-[10px] font-medium ${statusStyle}`}>
                  {statusLabel}
                </Badge>
              </SheetTitle>
              <SheetDescription className="sr-only">スロットの詳細情報と設定</SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="py-4">
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold">スロット情報</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">スロット番号</p>
                  <p className="text-sm font-medium">{slot.slot_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">ステータス</p>
                  <Badge variant="outline" className={`gap-1 text-xs font-medium ${statusStyle}`}>
                    {statusLabel}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">ロッカー</p>
                  <p className="text-sm font-medium">{lockerArea}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">位置</p>
                  <p className="flex flex-wrap items-center gap-1 text-sm font-medium">
                    {slot.row_number}段目 {slot.column_number}列目
                    {isBottomRow ? (
                      <Badge
                        variant="outline"
                        className="bg-info/15 text-info border-info/20 ml-2 text-[10px] font-medium"
                      >
                        最下段
                      </Badge>
                    ) : null}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-2 text-xs">施錠方法</p>
                  {editingLockType && canEditSlot ? (
                    <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3">
                      <Select
                        value={selectedLockType}
                        onValueChange={(value) => setSelectedLockType(value as LockerLockType)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue>{LOCKER_LOCK_TYPE_LABELS[selectedLockType]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(LOCKER_LOCK_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setEditingLockType(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs"
                          disabled={isUpdating}
                          onClick={() => {
                            onUpdateSlot(slot.id, { lock_type: selectedLockType }).then(() => {
                              setEditingLockType(false);
                            });
                          }}
                        >
                          保存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {LOCKER_LOCK_TYPE_LABELS[slot.lock_type]}
                      </Badge>
                      {hasMember ? (
                        <TooltipProvider delay={0}>
                          <Tooltip>
                            <TooltipTrigger render={<span className="inline-flex" />}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="pointer-events-none h-6 px-2 text-xs opacity-50"
                                aria-disabled
                              >
                                変更
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">使用中のため変更不可</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : canEditSlot ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            setSelectedLockType(slot.lock_type);
                            setEditingLockType(true);
                          }}
                        >
                          変更
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">開閉方法</p>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {LOCKER_SLOT_OPEN_TYPE_LABELS[slot.open_type]}
                  </Badge>
                </div>
              </div>
              {canEditSlot ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full gap-2 text-xs"
                  onClick={() => {
                    setSlotSettingFormKey((key) => key + 1);
                    setSlotSettingDialogOpen(true);
                  }}
                >
                  スロット設定を編集
                </Button>
              ) : null}
            </div>

            <Separator className="-mx-6 w-[calc(100%+48px)]" />

            {hasMember ? (
              <>
                <div className="py-4">
                  <h3 className="text-muted-foreground mb-3 flex items-center gap-1 text-xs font-semibold">
                    <User className="size-3" />
                    契約者情報
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">契約者名</p>
                      <p className="text-sm font-medium">{slot.member_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">会員ID</p>
                      <p className="text-sm font-medium">{slot.member_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">契約プラン</p>
                      <p className="text-sm font-medium">{slot.option_contract_name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">契約開始日</p>
                      <p className="text-sm font-medium">
                        {formatDateYYYYMMDD(slot.contract_start_date)}
                      </p>
                    </div>
                    {slot.cancel_date ? (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1 text-xs">開放待ち日</p>
                        <p className="text-warning text-sm font-medium">
                          {formatDateYYYYMMDD(slot.cancel_date)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {slot.lock_type !== 'cylinder' ? (
                  <>
                    <Separator className="-mx-6 w-[calc(100%+48px)]" />
                    <div className="py-4">
                      <h3 className="text-muted-foreground mb-3 flex items-center gap-1 text-xs font-semibold">
                        <KeyRound className="size-3" />
                        パスワード管理
                      </h3>
                      {canEditSlot ? (
                        <LockerPasswordEditor
                          currentPassword={slot.password}
                          isSaving={isUpdating}
                          onSave={(password) => onUpdateSlot(slot.id, { password })}
                        />
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          パスワード変更の権限がありません
                        </p>
                      )}
                    </div>
                  </>
                ) : null}

                {slot.status === 'pending_release' && slot.cancel_date ? (
                  <>
                    <Separator className="-mx-6 w-[calc(100%+48px)]" />
                    <ReminderNotificationSection
                      cancelDate={slot.cancel_date}
                      notifications={slot.reminder_notifications}
                      isSending={isSendingReminder}
                      onSend={(reminderDays) => onSendReminder(slot.id, reminderDays)}
                    />
                  </>
                ) : null}

                {isBottomRow ? (
                  <>
                    <Separator className="-mx-6 w-[calc(100%+48px)]" />
                    <SlotContractTypeSection
                      key={`${slot.id}-${slot.contract_type_code ?? ''}`}
                      slot={slot}
                      lockerOptionMasters={lockerOptionMasters}
                      isUpdating={isUpdating}
                      canAssignContract={canAssignContract}
                      onContractTypeSave={onContractTypeSave}
                    />
                  </>
                ) : null}

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                <div className="py-4">
                  <h3 className="text-muted-foreground mb-3 text-xs font-semibold">操作</h3>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      disabled={!contractDetailId}
                      onClick={() => {
                        if (!contractDetailId) return;
                        router.push(navigate('/lockers/contracts/[id]', contractDetailId));
                      }}
                    >
                      契約詳細を見る
                    </Button>
                    {slot.status === 'pending_release' && canEditSlot ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-1 text-xs"
                        onClick={() => onRelease?.(slot.slot_number)}
                      >
                        <Unlock className="size-3" />
                        このスロットを開放する
                      </Button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-4">
                <div className="bg-muted/30 rounded-lg border p-8 text-center">
                  <Lock className="text-muted-foreground mx-auto mb-3 size-8" />
                  <p className="text-sm font-medium">このスロットは利用可能です</p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SlotSettingDialog
        open={slotSettingDialogOpen}
        formKey={slotSettingFormKey}
        onOpenChange={setSlotSettingDialogOpen}
        slotNumber={slot.slot_number}
        isInUse={slot.status === 'in_use'}
        isSaving={isUpdating}
        widthCm={slot.width_cm}
        heightCm={slot.height_cm}
        depthCm={slot.depth_cm}
        openType={slot.open_type}
        lockType={slot.lock_type}
        password={slot.password}
        onSave={(patch) => onUpdateSlot(slot.id, patch)}
      />
    </>
  );
}
