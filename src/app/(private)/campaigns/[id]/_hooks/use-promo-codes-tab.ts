'use client';

import { useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useDebounce } from '@/hooks/use-debounce.hook';

import {
  getCrmCampaignsByIdQueryKey,
  getCrmPromoCodesOptions,
  getCrmPromoCodesQueryKey,
  patchCrmPromoCodesByIdStatusMutation,
  postCrmPromoCodesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  CampaignDetailResponse,
  PromoCodeEffectiveStatus,
  PromoCodeListItemResponse,
} from '@/lib/api/types.gen';

import {
  PROMO_CODE_SCOPE_UNSELECTED,
  type PromoCodeIssuanceValues,
} from '../_schemas/promo-code-issuance.schema';

const ALL = 'all';
const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 25;

/** プロモーションコードタブの検索・発行・無効化をまとめる。 */
export function usePromoCodesTab(campaign: CampaignDetailResponse) {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromoCodeEffectiveStatus | typeof ALL>(ALL);
  const [issuerFilter, setIssuerFilter] = useState<string>(ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState<PromoCodeListItemResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  const listQuery = useQuery({
    ...getCrmPromoCodesOptions({
      query: {
        campaignId: campaign.id,
        query: debouncedSearchQuery || undefined,
        status: statusFilter === ALL ? undefined : statusFilter,
        createdBy: issuerFilter === ALL ? undefined : issuerFilter,
        page: currentPage,
        limit: pageSize,
      },
    }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getCrmPromoCodesQueryKey() });
    queryClient.invalidateQueries({
      queryKey: getCrmCampaignsByIdQueryKey({ path: { id: campaign.id } }),
    });
  };

  const issueMutation = useMutation({
    ...postCrmPromoCodesMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'プロモーションコードを発行しました');
      setIssueDialogOpen(false);
      invalidate();
    },
    onError: (error) => {
      const userMessage =
        typeof error === 'object' && error !== null && 'userMessage' in error
          ? String((error as { userMessage?: string }).userMessage)
          : 'プロモーションコードの発行に失敗しました';
      toast.error(userMessage);
    },
  });

  const statusMutation = useMutation({
    ...patchCrmPromoCodesByIdStatusMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'プロモーションコードを更新しました');
      setDisableTarget(null);
      invalidate();
    },
    onError: (error) => {
      const userMessage =
        typeof error === 'object' && error !== null && 'userMessage' in error
          ? String((error as { userMessage?: string }).userMessage)
          : 'プロモーションコードの更新に失敗しました';
      toast.error(userMessage);
    },
  });

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const issueCode = (values: PromoCodeIssuanceValues) => {
    if (values.scopeType === PROMO_CODE_SCOPE_UNSELECTED) return;
    const scopeType = values.scopeType;

    issueMutation.mutate({
      body: {
        campaignId: values.campaignId,
        generationMethod: values.generationMethod,
        code: values.generationMethod === 'manual' ? values.code : undefined,
        description: values.description || null,
        scopeType,
        issuedStoreId: scopeType === 'issuer_store_only' ? values.issuedStoreId : null,
        brandEnum: campaign.brandEnum,
        validFrom: values.validFrom,
        validTo: values.validTo,
        maxUses: values.maxUses === '' ? null : Number(values.maxUses),
      },
    });
  };

  const disableCode = (reason: string) => {
    if (!disableTarget) return;
    statusMutation.mutate({
      path: { id: disableTarget.id },
      body: { action: 'disable', reason },
    });
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== ALL || issuerFilter !== ALL;

  const summary = useMemo(
    () =>
      listQuery.data?.summary ?? {
        issuedCount: 0,
        totalUsedCount: 0,
      },
    [listQuery.data?.summary],
  );

  return {
    promoCodes: listQuery.data?.items ?? [],
    totalCount: listQuery.data?.pagination.totalAllItems ?? 0,
    filteredCount: listQuery.data?.pagination.totalItems ?? 0,
    summary,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    hasActiveFilters,

    searchQuery,
    setSearchQuery: (next: string) => {
      setSearchQuery(next);
      setCurrentPage(1);
    },
    statusFilter,
    setStatusFilter: (next: PromoCodeEffectiveStatus | typeof ALL) => {
      setStatusFilter(next);
      setCurrentPage(1);
    },
    issuerFilter,
    setIssuerFilter: (next: string) => {
      setIssuerFilter(next);
      setCurrentPage(1);
    },
    clearFilters: () => {
      setSearchQuery('');
      setStatusFilter(ALL);
      setIssuerFilter(ALL);
      setCurrentPage(1);
    },

    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: (next: number) => {
      setPageSize(next);
      setCurrentPage(1);
    },

    issueDialogOpen,
    setIssueDialogOpen,
    issueCode,
    isIssuing: issueMutation.isPending,

    disableTarget,
    setDisableTarget,
    disableCode,
    isDisabling: statusMutation.isPending,

    copiedCode,
    copyCode,
  };
}

export type PromoCodesTabHook = ReturnType<typeof usePromoCodesTab>;
