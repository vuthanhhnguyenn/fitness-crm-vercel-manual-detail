'use client';

import { FileDown, Plus, Search } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Permission } from '@/types/permission.type';

import {
  PROMO_CODE_ISSUER_FILTER_OPTIONS,
  PROMO_CODE_STATUS_FILTER_OPTIONS,
} from '../_constants/promo-code.constants';

type PromoCodeStatusFilter = (typeof PROMO_CODE_STATUS_FILTER_OPTIONS)[number]['value'];
type PromoCodeIssuerFilter = (typeof PROMO_CODE_ISSUER_FILTER_OPTIONS)[number]['value'];

interface PromoCodeSearchFiltersProps {
  isMounted: boolean;
  searchQuery: string;
  statusFilter: PromoCodeStatusFilter;
  issuerFilter: PromoCodeIssuerFilter;
  filteredCount: number;
  totalCount: number;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: PromoCodeStatusFilter) => void;
  onIssuerFilterChange: (value: PromoCodeIssuerFilter) => void;
  onOpenCreate: () => void;
}

function getSelectedLabel<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
) {
  return options.find((option) => option.value === value)?.label ?? '';
}

export function PromoCodeSearchFilters({
  isMounted,
  searchQuery,
  statusFilter,
  issuerFilter,
  filteredCount,
  totalCount,
  onSearchQueryChange,
  onStatusFilterChange,
  onIssuerFilterChange,
  onOpenCreate,
}: PromoCodeSearchFiltersProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">プロモーションコード一覧</p>
        <div className="flex items-center gap-2">
          {!isMounted ? (
            <>
              <div className="bg-muted h-8 w-20 animate-pulse rounded-md" />
              <div className="bg-muted h-8 w-20 animate-pulse rounded-md" />
            </>
          ) : (
            <>
              <RoleGatedButton
                requiredPermission={Permission.CampaignsPromoCodeExport}
                variant="outline"
                size="sm"
                className="gap-1"
                disabled
                title="CSV出力は未実装です"
              >
                <FileDown className="size-4" />
                CSV出力
              </RoleGatedButton>
              <RoleGatedButton
                requiredPermission={Permission.CampaignsPromoCodeCreate}
                size="sm"
                className="gap-1"
                onClick={onOpenCreate}
              >
                <Plus className="size-4" />
                コード発行
              </RoleGatedButton>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="コード・説明で検索"
            className="h-8 pl-8 text-sm"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusFilterChange(value as PromoCodeStatusFilter)}
        >
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SelectValue>
              {getSelectedLabel(PROMO_CODE_STATUS_FILTER_OPTIONS, statusFilter)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PROMO_CODE_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={issuerFilter}
          onValueChange={(value) => onIssuerFilterChange(value as PromoCodeIssuerFilter)}
        >
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SelectValue>
              {getSelectedLabel(PROMO_CODE_ISSUER_FILTER_OPTIONS, issuerFilter)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PROMO_CODE_ISSUER_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground ml-auto text-xs">
          {filteredCount}件 / {totalCount}件
        </p>
      </div>
    </div>
  );
}
