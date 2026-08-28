'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AppVersionBrandEnum } from '@/lib/api/types.gen';

import { APP_VERSION_BRAND_LABELS } from '../_constants/app-version.constants';
import type { useAppVersionsFilters } from '../_hooks/use-app-versions-filters';

interface AppVersionFiltersProps {
  filtersHook: ReturnType<typeof useAppVersionsFilters>;
}

export function AppVersionFilters({ filtersHook }: AppVersionFiltersProps) {
  const { filters, setFilters } = filtersHook;

  const BRAND_FILTER_ITEMS: Record<string, string> = {
    all: '全ブランド',
    ...APP_VERSION_BRAND_LABELS,
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <Select
        items={BRAND_FILTER_ITEMS}
        value={filters.brandEnum ?? 'all'}
        onValueChange={(value) =>
          setFilters({
            brandEnum: value === 'all' ? null : (value as AppVersionBrandEnum),
            page: 1,
          })
        }
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(BRAND_FILTER_ITEMS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
