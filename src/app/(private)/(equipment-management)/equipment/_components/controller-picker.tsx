'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { SearchableSelect } from '@/components/common/searchable-select';

import { getCrmControllersOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Controller } from '@/lib/api/types.gen';

import { EQUIPMENT_STATUS_LABELS } from '../_constants/constants';

type ControllerPickerProps = {
  value: string | null;
  onChange: (controllerId: string | null) => void;
  hasError?: boolean;
};

export function ControllerPicker({ value, onChange, hasError = false }: ControllerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isFetching } = useQuery(getCrmControllersOptions({ query: { limit: 50 } }));

  const controllers = data?.items ?? [];
  const selected = value ? controllers.find((c) => c.controller_id === value) : undefined;

  return (
    <SearchableSelect<Controller>
      value={value || null}
      valueLabel={selected ? (selected.name ?? selected.controller_id) : undefined}
      options={controllers}
      placeholder="接点制御装置を選択"
      searchPlaceholder="装置名・装置ID・IPで検索..."
      emptyMessage="該当する接点制御装置がありません"
      loadingMessage="接点制御装置を読み込み中..."
      isLoading={isFetching}
      open={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(controller) => onChange(controller?.controller_id ?? null)}
      getOptionKey={(controller) => controller.controller_id}
      getOptionLabel={(controller) => controller.name ?? controller.controller_id}
      getOptionKeywords={(controller) =>
        [controller.name, controller.controller_id, controller.ip_address].filter(Boolean).join(' ')
      }
      clearLabel="選択をクリア"
      hasError={hasError}
      renderOption={(controller) => (
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">{controller.name ?? controller.controller_id}</span>
          <span className="text-muted-foreground text-xs">
            {controller.controller_id} ・ {controller.ip_address}:{controller.port} ・{' '}
            {EQUIPMENT_STATUS_LABELS[controller.status]}
          </span>
        </div>
      )}
      triggerClassName="h-9 w-full"
    />
  );
}
