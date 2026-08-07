'use client';

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';
import { toast } from 'sonner';

import {
  getCrmCampaignsByIdQueryKey,
  getCrmPromoCodesOptions,
  getCrmPromoCodesQueryKey,
  patchCrmPromoCodesByCodeMutation,
  postCrmPromoCodesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmPromoCodesResponse } from '@/lib/api/types.gen';

import { UserRole } from '@/types/permission.type';

import { type PromoCodeIssuanceResult } from '../_components/promo-code-create-dialog';
import { type PromoCodeListRow } from '../_components/promo-code-table';
import { PROMO_CODE_ISSUER_LABELS } from '../_constants/promo-code.constants';

export interface PromoCodePreview {
  code: string;
  description: string | null;
  valid_from: string;
  valid_to: string;
  status: PromoCodeListRow['status'];
}

interface UsePromoCodesTabParams {
  campaignId: string;
  campaignName: string;
  promoCodePreviews?: readonly PromoCodePreview[];
}

const PROMO_CODE_FILTER_STATUS_VALUES = [
  'all',
  'active',
  'expired',
  'limit_reached',
  'inactive',
] as const;
const PROMO_CODE_FILTER_ISSUER_VALUES = ['all', 'headquarter', 'store_staff'] as const;

type PromoCodeResponseItem = GetCrmPromoCodesResponse['promo_codes'][number];

function mapPreviewItemToResponse(
  campaignId: string,
  campaignName: string,
  promoCode: PromoCodePreview,
): GetCrmPromoCodesResponse['promo_codes'][number] {
  return {
    id: `preview-${promoCode.code}`,
    campaign_id: campaignId,
    campaign_name: campaignName,
    code: promoCode.code,
    description: promoCode.description,
    valid_from: promoCode.valid_from,
    valid_to: promoCode.valid_to,
    usage_count: 0,
    usage_cap: null,
    usage_cap_label: '—',
    store_scope_label: '—',
    issued_by_label: PROMO_CODE_ISSUER_LABELS.headquarter,
    discount_total_label: '—',
    status: promoCode.status,
    disabled_reason: null,
    created_at: '',
    updated_at: '',
  };
}

function mapRecordToRow(record: PromoCodeResponseItem): PromoCodeListRow {
  return {
    code: record.code,
    description: record.description,
    campaignName: record.campaign_name,
    validFrom: record.valid_from,
    validTo: record.valid_to,
    usageCount: record.usage_count,
    usageCap: record.usage_cap,
    usageCapLabel: record.usage_cap_label,
    storeScopeLabel: record.store_scope_label,
    issuedByLabel: record.issued_by_label,
    discountTotalLabel: record.discount_total_label,
    status: record.status,
  };
}

function mergeResponse(
  current: GetCrmPromoCodesResponse | undefined,
  next: PromoCodeResponseItem,
): GetCrmPromoCodesResponse {
  const merged = new Map<string, PromoCodeResponseItem>();

  for (const row of current?.promo_codes ?? []) {
    merged.set(row.code, row);
  }

  merged.set(next.code, next);

  return { promo_codes: Array.from(merged.values()) };
}

export function usePromoCodesTab({
  campaignId,
  campaignName,
  promoCodePreviews,
}: UsePromoCodesTabParams) {
  const { user } = useAuthUser();
  const currentRole = (user?.role as UserRole) ?? UserRole.Staff;
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const queryClient = useQueryClient();

  const initialRows = useMemo(
    () => ({
      promo_codes: (promoCodePreviews ?? []).map((promoCode) =>
        mapPreviewItemToResponse(campaignId, campaignName, promoCode),
      ),
    }),
    [campaignId, campaignName, promoCodePreviews],
  );

  const promoCodeQueryKey = useMemo(
    () => getCrmPromoCodesQueryKey({ query: { campaign_id: campaignId } }),
    [campaignId],
  );

  const promoCodesQuery = useQuery({
    ...getCrmPromoCodesOptions({ query: { campaign_id: campaignId } }),
    initialData: initialRows,
  });

  const rows = useMemo(
    () => (promoCodesQuery.data?.promo_codes ?? []).map(mapRecordToRow),
    [promoCodesQuery.data],
  );
  const [filters, setFilters] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      status: parseAsStringEnum([...PROMO_CODE_FILTER_STATUS_VALUES]).withDefault('all'),
      issuer: parseAsStringEnum([...PROMO_CODE_FILTER_ISSUER_VALUES]).withDefault('all'),
    },
    {
      history: 'replace',
      shallow: true,
    },
  );
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [disableTarget, setDisableTarget] = useState<PromoCodeListRow | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const deferredSearchQuery = useDeferredValue(filters.search);

  const existingCodes = useMemo(() => rows.map((row) => row.code), [rows]);

  const filteredRows = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    const currentStatus = filters.status as 'all' | PromoCodeListRow['status'];
    const currentIssuer = filters.issuer as 'all' | 'headquarter' | 'store_staff';

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.code.toLowerCase().includes(q) ||
        (row.description?.toLowerCase().includes(q) ?? false);
      const matchesStatus = currentStatus === 'all' || row.status === currentStatus;
      const matchesIssuer =
        currentIssuer === 'all' || row.issuedByLabel === PROMO_CODE_ISSUER_LABELS[currentIssuer];

      return matchesSearch && matchesStatus && matchesIssuer;
    });
  }, [deferredSearchQuery, filters.issuer, filters.status, rows]);

  const totalUsage = useMemo(
    () => rows.reduce((sum, row) => sum + (row.usageCount ?? 0), 0),
    [rows],
  );

  const createMutation = useMutation({
    ...postCrmPromoCodesMutation(),
    onSuccess: (response) => {
      queryClient.setQueryData<GetCrmPromoCodesResponse>(promoCodeQueryKey, (current) =>
        mergeResponse(current, response.promo_code),
      );
      void queryClient.invalidateQueries({
        queryKey: promoCodeQueryKey,
        refetchType: 'all',
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdQueryKey({ path: { id: campaignId } }),
        refetchType: 'all',
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'プロモーションコードの発行に失敗しました',
      );
    },
  });

  const disableMutation = useMutation({
    ...patchCrmPromoCodesByCodeMutation(),
    onSuccess: (response) => {
      queryClient.setQueryData<GetCrmPromoCodesResponse>(promoCodeQueryKey, (current) =>
        mergeResponse(current, response.promo_code),
      );
      void queryClient.invalidateQueries({
        queryKey: promoCodeQueryKey,
        refetchType: 'all',
      });
      setDisableTarget(null);
      setDisableReason('');
      void queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdQueryKey({ path: { id: campaignId } }),
        refetchType: 'all',
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'プロモーションコードの無効化に失敗しました',
      );
    },
  });

  const handleCreate = async (result: PromoCodeIssuanceResult) => {
    try {
      await createMutation.mutateAsync({
        body: {
          campaignId: result.campaignId,
          campaignName: result.campaignName,
          code: result.code,
          description: result.description,
          validFrom: result.validFrom,
          validTo: result.validTo,
          usageCount: result.usageCount,
          usageCap: result.usageCap,
          usageCapMode: result.usageCapMode,
          storeScope: result.storeScope,
          issuedByLabel: result.issuedByLabel,
          status: result.status,
        },
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    void navigator.clipboard.writeText(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDisableSubmit = () => {
    if (!disableTarget) {
      return;
    }

    disableMutation.mutate({
      path: { code: disableTarget.code },
      body: {
        status: 'inactive',
        reason: disableReason,
      },
    });
  };

  return {
    currentRole,
    isMounted,
    open,
    setOpen,
    dialogKey,
    setDialogKey,
    rows,
    filteredRows,
    copiedCode,
    searchQuery: filters.search,
    setSearchQuery: (value: string) => setFilters({ search: value || null }),
    statusFilter: filters.status,
    setStatusFilter: (value: 'all' | PromoCodeListRow['status']) =>
      setFilters({ status: value === 'all' ? null : value }),
    issuerFilter: filters.issuer,
    setIssuerFilter: (value: 'all' | 'headquarter' | 'store_staff') =>
      setFilters({ issuer: value === 'all' ? null : value }),
    disableTarget,
    setDisableTarget,
    disableReason,
    setDisableReason,
    totalUsage,
    existingCodes,
    handleCreate,
    handleCopyCode,
    handleDisableSubmit,
  };
}
