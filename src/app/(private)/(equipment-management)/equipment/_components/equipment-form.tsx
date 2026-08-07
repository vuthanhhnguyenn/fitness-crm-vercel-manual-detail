'use client';

import { EquipmentFormBasicInfo } from './equipment-form-basic-info';
import { EquipmentFormConnection } from './equipment-form-connection';
import { EquipmentFormRemarks } from './equipment-form-remarks';
import { EquipmentFormUsageRule } from './equipment-form-usage-rule';

type EquipmentFormProps = {
  mode?: 'create' | 'edit';
  equipmentId?: string;
};

export function EquipmentForm({ mode = 'create', equipmentId }: EquipmentFormProps) {
  return (
    <div className="space-y-6">
      <EquipmentFormBasicInfo equipmentId={mode === 'edit' ? equipmentId : undefined} />
      <EquipmentFormConnection />
      <EquipmentFormUsageRule />
      <EquipmentFormRemarks />
    </div>
  );
}
