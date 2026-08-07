'use client';

import { Card } from '@/components/ui/card';

import { type PromoCodePreview, usePromoCodesTab } from '../_hooks/use-promo-codes-tab';
import { PromoCodeCreateDialog } from './promo-code-create-dialog';
import { PromoCodeDisableDialog } from './promo-code-disable-dialog';
import { PromoCodeSearchFilters } from './promo-code-search-filters';
import { PromoCodeTable } from './promo-code-table';
import { PromoCodeUsageSummary } from './promo-code-usage-summary';

interface PromoCodeSectionProps {
  campaignId: string;
  campaignCode: string;
  campaignName: string;
  promoCodePreviews?: readonly PromoCodePreview[];
}

export function PromoCodeSection({
  campaignId,
  campaignCode,
  campaignName,
  promoCodePreviews,
}: PromoCodeSectionProps) {
  const {
    currentRole,
    isMounted,
    open,
    setOpen,
    dialogKey,
    setDialogKey,
    rows,
    filteredRows,
    copiedCode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    issuerFilter,
    setIssuerFilter,
    disableTarget,
    setDisableTarget,
    disableReason,
    setDisableReason,
    totalUsage,
    existingCodes,
    handleCreate,
    handleCopyCode,
    handleDisableSubmit,
  } = usePromoCodesTab({
    campaignId,
    campaignName,
    promoCodePreviews,
  });

  return (
    <Card className="gap-0 py-0">
      <PromoCodeSearchFilters
        isMounted={isMounted}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        issuerFilter={issuerFilter}
        filteredCount={filteredRows.length}
        totalCount={rows.length}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onIssuerFilterChange={setIssuerFilter}
        onOpenCreate={() => {
          setDialogKey((current) => current + 1);
          setOpen(true);
        }}
      />

      <PromoCodeTable
        rows={filteredRows}
        copiedCode={copiedCode}
        onCopyCode={handleCopyCode}
        onRequestDisable={(row) => setDisableTarget(row)}
      />

      <PromoCodeUsageSummary issuedCount={rows.length} totalUsage={totalUsage} />

      <PromoCodeCreateDialog
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        campaignOptions={[{ id: campaignId, name: campaignName, code: campaignCode }]}
        defaultCampaignId={campaignId}
        defaultCampaignCode={campaignCode}
        existingCodes={existingCodes}
        currentRole={currentRole}
        onCreate={handleCreate}
      />

      <PromoCodeDisableDialog
        open={disableTarget !== null}
        target={disableTarget}
        reason={disableReason}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDisableTarget(null);
            setDisableReason('');
          }
        }}
        onReasonChange={setDisableReason}
        onSubmit={handleDisableSubmit}
      />
    </Card>
  );
}
