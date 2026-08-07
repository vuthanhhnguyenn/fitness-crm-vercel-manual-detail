'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { LockerLockType, PatchCrmLockersByIdSlotsBySlotIdData } from '@/lib/api/types.gen';

import { LOCKER_LOCK_TYPE_LABELS } from '../../_constants/constants';

type UpdateLockerSlotBody = NonNullable<PatchCrmLockersByIdSlotsBySlotIdData['body']>;

interface SlotSettingDialogProps {
  open: boolean;
  formKey: number;
  onOpenChange: (open: boolean) => void;
  slotNumber: string;
  isInUse: boolean;
  isSaving?: boolean;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  openType: 'door' | 'drawer';
  lockType: LockerLockType;
  password: string | null;
  onSave: (patch: UpdateLockerSlotBody) => void;
}

type SlotSettingFormProps = Omit<SlotSettingDialogProps, 'open' | 'formKey' | 'onOpenChange'> & {
  onClose: () => void;
};

function parsePositiveInt(value: string): number | null {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function buildSlotSettingPatch(params: {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  openType: 'door' | 'drawer';
  lockType: LockerLockType;
  password: string | null;
  isInUse: boolean;
  slotWidth: string;
  slotHeight: string;
  slotDepth: string;
  slotOpenMethod: 'door' | 'drawer';
  slotLockMethod: LockerLockType;
  slotPinCode: string;
}): { patch: UpdateLockerSlotBody; isValid: boolean } {
  const patch: UpdateLockerSlotBody = {};
  let isValid = true;

  if (params.slotWidth !== String(params.widthCm)) {
    const nextWidth = parsePositiveInt(params.slotWidth);
    if (nextWidth === null) isValid = false;
    else patch.width_cm = nextWidth;
  }

  if (params.slotHeight !== String(params.heightCm)) {
    const nextHeight = parsePositiveInt(params.slotHeight);
    if (nextHeight === null) isValid = false;
    else patch.height_cm = nextHeight;
  }

  if (params.slotDepth !== String(params.depthCm)) {
    const nextDepth = parsePositiveInt(params.slotDepth);
    if (nextDepth === null) isValid = false;
    else patch.depth_cm = nextDepth;
  }

  if (params.slotOpenMethod !== params.openType) {
    patch.open_type = params.slotOpenMethod;
  }

  const effectiveLockType = params.isInUse ? params.lockType : params.slotLockMethod;

  if (!params.isInUse && params.slotLockMethod !== params.lockType) {
    patch.lock_type = params.slotLockMethod;
  }

  const initialPin = params.password ?? '';

  if (effectiveLockType === 'dial' && params.slotPinCode !== initialPin) {
    if (params.slotPinCode.length !== 4) isValid = false;
    else patch.password = params.slotPinCode;
  }

  if (patch.lock_type === 'cylinder') {
    patch.password = null;
  }

  return { patch, isValid };
}

function SlotSettingForm({
  slotNumber,
  isInUse,
  isSaving = false,
  widthCm,
  heightCm,
  depthCm,
  openType,
  lockType,
  password,
  onSave,
  onClose,
}: SlotSettingFormProps) {
  const [slotWidth, setSlotWidth] = useState(String(widthCm));
  const [slotHeight, setSlotHeight] = useState(String(heightCm));
  const [slotDepth, setSlotDepth] = useState(String(depthCm));
  const [slotOpenMethod, setSlotOpenMethod] = useState<'door' | 'drawer'>(
    openType === 'door' ? 'door' : 'drawer',
  );
  const [slotLockMethod, setSlotLockMethod] = useState<LockerLockType>(lockType);
  const [slotPinCode, setSlotPinCode] = useState(password ?? '');

  const { patch, isValid } = useMemo(
    () =>
      buildSlotSettingPatch({
        widthCm,
        heightCm,
        depthCm,
        openType,
        lockType,
        password,
        isInUse,
        slotWidth,
        slotHeight,
        slotDepth,
        slotOpenMethod,
        slotLockMethod,
        slotPinCode,
      }),
    [
      widthCm,
      heightCm,
      depthCm,
      openType,
      lockType,
      password,
      isInUse,
      slotWidth,
      slotHeight,
      slotDepth,
      slotOpenMethod,
      slotLockMethod,
      slotPinCode,
    ],
  );

  const hasChanges = Object.keys(patch).length > 0;
  const canSave = hasChanges && isValid && !isSaving;

  return (
    <>
      <DialogHeader>
        <DialogTitle>スロット設定を編集</DialogTitle>
        <DialogDescription>{slotNumber} の個別設定を変更します</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div>
          <Label className="mb-2 block text-xs font-medium">スロットサイズ（単位: cm）</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">横幅:</span>
              <Input
                className="h-8 w-16 text-sm"
                value={slotWidth}
                onChange={(event) => setSlotWidth(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">高さ:</span>
              <Input
                className="h-8 w-16 text-sm"
                value={slotHeight}
                onChange={(event) => setSlotHeight(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">奥行き:</span>
              <Input
                className="h-8 w-16 text-sm"
                value={slotDepth}
                onChange={(event) => setSlotDepth(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-medium">開閉方法</Label>
          <RadioGroup
            value={slotOpenMethod}
            onValueChange={(value) => setSlotOpenMethod(value as 'door' | 'drawer')}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="door" id="open-door" />
              <Label htmlFor="open-door" className="cursor-pointer text-sm font-normal">
                扉型
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="drawer" id="open-drawer" />
              <Label htmlFor="open-drawer" className="cursor-pointer text-sm font-normal">
                引き出し型
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-medium">施錠方法</Label>
          {isInUse ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-normal">
                {LOCKER_LOCK_TYPE_LABELS[slotLockMethod]}
              </Badge>
              <span className="text-muted-foreground text-xs">（使用中のため変更不可）</span>
            </div>
          ) : (
            <RadioGroup
              value={slotLockMethod}
              onValueChange={(value) => setSlotLockMethod(value as LockerLockType)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="dial" id="lock-dial" />
                <Label htmlFor="lock-dial" className="cursor-pointer text-sm font-normal">
                  ダイヤル錠
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="cylinder" id="lock-cylinder" />
                <Label htmlFor="lock-cylinder" className="cursor-pointer text-sm font-normal">
                  シリンダー錠
                </Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {slotLockMethod === 'dial' ? (
          <div>
            <Label className="mb-2 block text-xs font-medium">暗証番号（4桁）</Label>
            <Input
              className="h-8 w-24 text-center font-mono text-sm tracking-widest"
              value={slotPinCode}
              maxLength={4}
              onChange={(event) =>
                setSlotPinCode(event.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="0000"
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">シリンダー錠のため暗証番号なし</p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          disabled={!canSave}
          onClick={() => {
            if (!canSave) return;
            onSave(patch);
            onClose();
          }}
        >
          保存
        </Button>
      </DialogFooter>
    </>
  );
}

export function SlotSettingDialog({
  open,
  formKey,
  onOpenChange,
  ...formProps
}: SlotSettingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open ? (
          <SlotSettingForm key={formKey} {...formProps} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
