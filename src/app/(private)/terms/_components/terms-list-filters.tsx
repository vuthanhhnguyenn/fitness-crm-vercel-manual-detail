'use client';

import { Search, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  TERMS_STATUS_LABELS,
  TERMS_TYPE_LABELS,
  type TermsBrand,
  type TermsStatus,
  type TermsType,
} from '../_constants/constants';
import { useTermsFiltersContext } from '../_contexts/terms-filters-context';

function getFilterActiveClass(isActive: boolean) {
  return isActive ? 'border-primary bg-primary/10 text-foreground' : '';
}

const TERM_TYPE_TABS: ReadonlyArray<{ value: TermsType | 'all'; label: string }> = [
  { value: 'all', label: 'すべて' },
  ...(
    Object.entries(TERMS_TYPE_LABELS) as Array<[TermsType, (typeof TERMS_TYPE_LABELS)[TermsType]]>
  ).map(([value, label]) => ({
    value: value as TermsType,
    label,
  })),
];

export function TermsListFilters({ children }: Readonly<{ children: React.ReactNode }>) {
  const {
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    clearFilters,
    filteredTotal,
    totalAllItems,
  } = useTermsFiltersContext();

  const summaryParts: string[] = [];
  const normalizedSearchInput = searchInput.trim();
  const showSummaryBanner =
    filters.brandEnum !== null || filters.status !== null || normalizedSearchInput.length > 0;
  if (normalizedSearchInput) {
    summaryParts.push(`"${normalizedSearchInput}"`);
  }
  if (filters.brandEnum) {
    summaryParts.push(filters.brandEnum);
  }
  if (filters.status) {
    summaryParts.push(TERMS_STATUS_LABELS[filters.status]);
  }

  return (
    <div className="flex flex-col gap-3">
      {showSummaryBanner && (
        <Alert className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <AlertDescription className="text-xs">
            {filteredTotal} / {totalAllItems} 件を抽出中
            {summaryParts.length > 0 ? (
              <span className="text-muted-foreground ml-1">: {summaryParts.join(' ・ ')}</span>
            ) : null}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={clearFilters}
          >
            <X className="size-3.5" />
            条件をクリア
          </Button>
        </Alert>
      )}

      <Tabs
        value={filters.termsType ?? 'all'}
        onValueChange={(value) => {
          updateFilter('termsType', value === 'all' ? null : (value as TermsType));
        }}
      >
        <TabsList variant="line" className="gap-2">
          {TERM_TYPE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filters.termsType ?? 'all'} className="mt-3">
          <Card className="gap-0 py-0">
            <div className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative max-w-[400px] min-w-[240px] flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={searchInput}
                    onChange={(event) => {
                      setSearchInput(event.target.value);
                    }}
                    placeholder="規約ID・規約名で検索..."
                    className="pl-9 text-xs"
                    maxLength={100}
                  />
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Select
                    value={filters.brandEnum ?? '全ブランド'}
                    onValueChange={(value) => {
                      updateFilter(
                        'brandEnum',
                        value === '全ブランド' ? null : (value as TermsBrand),
                      );
                    }}
                  >
                    <SelectTrigger
                      className={`${getFilterActiveClass(filters.brandEnum !== null)} h-8 w-[140px] text-xs`}
                    >
                      <SelectValue placeholder="全ブランド" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全ブランド">全ブランド</SelectItem>
                      <SelectItem value="JOYFIT">JOYFIT</SelectItem>
                      <SelectItem value="FIT365">FIT365</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.status ?? '全ステータス'}
                    onValueChange={(value) => {
                      updateFilter(
                        'status',
                        value === '全ステータス' ? null : (value as TermsStatus),
                      );
                    }}
                  >
                    <SelectTrigger
                      className={`${getFilterActiveClass(filters.status !== null)} h-8 w-[140px] text-xs`}
                    >
                      <SelectValue>
                        {filters.status ? TERMS_STATUS_LABELS[filters.status] : '全ステータス'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全ステータス">全ステータス</SelectItem>
                      {(
                        Object.entries(TERMS_STATUS_LABELS) as Array<
                          [TermsStatus, (typeof TERMS_STATUS_LABELS)[TermsStatus]]
                        >
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="flex cursor-pointer items-center gap-2 text-xs select-none">
                    <Checkbox
                      checked={filters.includeDeleted === 'true'}
                      onCheckedChange={(checked) => {
                        updateFilter('includeDeleted', checked ? 'true' : 'false');
                      }}
                      className="size-4"
                    />
                    削除済みも含めて表示
                  </label>
                </div>
              </div>
            </div>

            {children}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
