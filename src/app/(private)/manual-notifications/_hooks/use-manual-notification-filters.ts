import { useCallback, useEffect, useRef, useState } from 'react';

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

import { useDebounce } from '@/hooks/use-debounce.hook';

import type { GetCrmNotificationsData } from '@/lib/api/types.gen';

import {
  MANUAL_NOTIFICATION_CHANNEL_OPTIONS,
  MANUAL_NOTIFICATION_STATUS_OPTIONS,
  MANUAL_NOTIFICATION_TARGET_OPTIONS,
} from '../_constants/manual-notification.constants';
import { ManualNotificationListQuerySchema } from '../_schemas/manual-notification-list-query.schema';

type NotificationsQuery = NonNullable<GetCrmNotificationsData['query']>;
type NotificationSort = NonNullable<NotificationsQuery['sort']>;

const SORT_OPTIONS = ['id', 'title', 'status', 'updatedAt'] as const satisfies NotificationSort[];

export function useManualNotificationFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(50),
      q: parseAsString.withDefault(''),
      status: parseAsStringEnum([...MANUAL_NOTIFICATION_STATUS_OPTIONS]),
      channel: parseAsStringEnum([...MANUAL_NOTIFICATION_CHANNEL_OPTIONS]),
      targetType: parseAsStringEnum([...MANUAL_NOTIFICATION_TARGET_OPTIONS]),
      sort: parseAsStringEnum([...SORT_OPTIONS]).withDefault('updatedAt'),
      order: parseAsStringEnum(['asc', 'desc']).withDefault('desc'),
    },
    { history: 'push', shallow: true },
  );

  const [searchInput, setSearchInputState] = useState(() => filters.q);
  const debouncedSearch = useDebounce(searchInput, 500);
  const lastUrlSearch = useRef(filters.q);

  const setSearchInput = useCallback((value: string) => {
    setSearchInputState(value);
  }, []);

  useEffect(() => {
    if (filters.q !== lastUrlSearch.current) {
      lastUrlSearch.current = filters.q;
      setSearchInputState(filters.q);
    }
  }, [filters.q]);

  useEffect(() => {
    if (debouncedSearch === filters.q) return;
    lastUrlSearch.current = debouncedSearch;
    void setFilters({ q: debouncedSearch || null, page: 1 });
  }, [debouncedSearch, filters.q, setFilters]);

  const clearFilters = useCallback(() => {
    lastUrlSearch.current = '';
    setSearchInputState('');
    void setFilters({
      page: 1,
      limit: 50,
      q: null,
      status: null,
      channel: null,
      targetType: null,
      sort: 'updatedAt',
      order: 'desc',
    });
  }, [setFilters]);

  const hasActiveFilters =
    searchInput.trim().length > 0 ||
    filters.status !== null ||
    filters.channel !== null ||
    filters.targetType !== null;

  const parsedQuery = ManualNotificationListQuerySchema.safeParse({
    page: filters.page,
    limit: filters.limit,
    q: filters.q || undefined,
    status: filters.status || undefined,
    channel: filters.channel || undefined,
    targetType: filters.targetType || undefined,
    sort: filters.sort,
    order: filters.order,
  });

  const queryParams: NotificationsQuery = parsedQuery.success
    ? {
        includeTotalAll: true,
        page: parsedQuery.data.page,
        limit: parsedQuery.data.limit,
        q: parsedQuery.data.q,
        status: parsedQuery.data.status ? [parsedQuery.data.status] : undefined,
        channel: parsedQuery.data.channel ? [parsedQuery.data.channel] : undefined,
        targetType: parsedQuery.data.targetType ? [parsedQuery.data.targetType] : undefined,
        sort: parsedQuery.data.sort,
        order: parsedQuery.data.order,
      }
    : {
        includeTotalAll: true,
        page: 1,
        limit: 50,
        sort: 'updatedAt',
        order: 'desc',
      };

  return {
    filters,
    queryParams,
    searchInput,
    setSearchInput,
    setFilters,
    clearFilters,
    hasActiveFilters,
    currentPage: filters.page,
    setCurrentPage: (page: number) => void setFilters({ page }),
    pageSize: filters.limit,
    setPageSize: (limit: number) => void setFilters({ limit, page: 1 }),
  };
}
