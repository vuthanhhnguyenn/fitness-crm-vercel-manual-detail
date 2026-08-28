'use client';

import { filterActiveClass } from '@/utils/app.util';
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

import type { PromoCodeEffectiveStatus } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { PROMO_CODE_ISSUER_OPTIONS, PROMO_CODE_STATUS_LABELS } from '../../_constants/constants';
import type { PromoCodesTabHook } from '../_hooks/use-promo-codes-tab';

type PromoCodeSearchFiltersProps = {
  tab: PromoCodesTabHook;
  onExport: () => void;
};

const ALL_STATUS_LABEL = 'すべてのステータス';
const ALL_ISSUER_LABEL = 'すべての発行者';

/** G-06 FR-014: 検索・ステータス・発行者フィルター + CSV出力 / コード発行。 */
export function PromoCodeSearchFilters({ tab, onExport }: Readonly<PromoCodeSearchFiltersProps>) {
  const statusLabel =
    tab.statusFilter === 'all' ? ALL_STATUS_LABEL : PROMO_CODE_STATUS_LABELS[tab.statusFilter];
  const isStatusActive = tab.statusFilter !== 'all';
  const isIssuerActive = tab.issuerFilter !== 'all';
  const issuerLabel =
    PROMO_CODE_ISSUER_OPTIONS.find((issuer) => issuer.value === tab.issuerFilter)?.label ??
    ALL_ISSUER_LABEL;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-xs flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="コード・説明で検索"
          className="h-8 pl-8 text-sm"
          value={tab.searchQuery}
          onChange={(event) => tab.setSearchQuery(event.target.value)}
        />
      </div>

      <Select
        value={tab.statusFilter}
        onValueChange={(value) =>
          tab.setStatusFilter(
            !value || value === 'all' ? 'all' : (value as PromoCodeEffectiveStatus),
          )
        }
      >
        {/* base-ui の Select.Value は既定で「値」を描画するため、一覧画面と同じく明示的にラベルを渡す。 */}
        <SelectTrigger
          size="sm"
          className={cn('h-8 w-[170px] text-sm', filterActiveClass(isStatusActive))}
        >
          <SelectValue placeholder={ALL_STATUS_LABEL}>{statusLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{ALL_STATUS_LABEL}</SelectItem>
          {Object.entries(PROMO_CODE_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={tab.issuerFilter}
        onValueChange={(value) => tab.setIssuerFilter(value ?? 'all')}
      >
        <SelectTrigger
          size="sm"
          className={cn('h-8 w-[160px] text-sm', filterActiveClass(isIssuerActive))}
        >
          <SelectValue placeholder={ALL_ISSUER_LABEL}>{issuerLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{ALL_ISSUER_LABEL}</SelectItem>
          {PROMO_CODE_ISSUER_OPTIONS.map((issuer) => (
            <SelectItem key={issuer.value} value={issuer.value}>
              {issuer.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-muted-foreground text-xs">
        {tab.filteredCount}件 / {tab.totalCount}件
      </p>

      <div className="ml-auto flex items-center gap-2">
        {/* G-06 FR-013: CSV出力は本部・システム・マネージャーのみ */}
        <RoleGatedButton
          requiredPermission={Permission.CampaignsPromoCodeExport}
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={onExport}
        >
          <FileDown className="size-4" />
          CSV出力
        </RoleGatedButton>
        <RoleGatedButton
          requiredPermission={Permission.CampaignsPromoCodeCreate}
          size="sm"
          className="h-8 gap-1"
          onClick={() => tab.setIssueDialogOpen(true)}
        >
          <Plus className="size-4" />
          コード発行
        </RoleGatedButton>
      </div>
    </div>
  );
}
