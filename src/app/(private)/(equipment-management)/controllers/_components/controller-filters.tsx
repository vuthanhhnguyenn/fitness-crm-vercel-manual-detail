'use client';

import { type Dispatch, type SetStateAction } from 'react';

import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  CONTROLLER_STATUS_LABELS,
  CONTROLLER_STATUS_VALUES,
  type ControllerStatus,
} from '../_constants/constants';

function filterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

interface ControllerFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  status: ControllerStatus | null;
  onStatusChange: (status: ControllerStatus | null) => void;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  clearFilterSelects: () => void;
  total: number;
}

export function ControllerFilters({
  searchInput,
  setSearchInput,
  status,
  onStatusChange,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  hasActiveFilters,
  clearFilters,
  clearFilterSelects,
  total,
}: ControllerFiltersProps) {
  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <Alert className="py-2">
          <AlertDescription className="flex items-center justify-between text-xs">
            <span>
              <span className="font-medium">{total} 件</span>を抽出中
              {status ? (
                <span className="text-muted-foreground ml-1">
                  : ステータス: {CONTROLLER_STATUS_LABELS[status]}
                </span>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 shrink-0 text-xs"
              onClick={clearFilters}
            >
              <X className="mr-1 size-3" />
              条件をクリア
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative max-w-[400px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="装置名、IPアドレスで検索"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-8 pl-9 text-xs"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={activeFilterCount > 0 ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setIsFilterOpen((previous) => !previous)}
            >
              <SlidersHorizontal className="size-4" />
              {isFilterOpen ? '閉じる' : '詳細フィルター'}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
              {isFilterOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </Button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status ?? 'all'}
              onValueChange={(value) =>
                onStatusChange(value === 'all' ? null : (value as ControllerStatus))
              }
            >
              <SelectTrigger className={`h-8 w-44 text-xs ${filterActiveClass(status !== null)}`}>
                <SelectValue placeholder="全ステータス">
                  {status ? CONTROLLER_STATUS_LABELS[status] : '全ステータス'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ステータス</SelectItem>
                {CONTROLLER_STATUS_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CONTROLLER_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-auto h-8 text-xs"
              onClick={clearFilterSelects}
            >
              すべてクリア
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
