import type {
  GetLockerContractsQuery,
  GetLockerPendingSlotsQuery,
  GetLockersQuery,
  LockerContractListItem,
  LockerListItem,
  LockerPendingSlotListItem,
} from '@/app/api/_schemas/locker.schema';

export function compareLockerValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b), 'ja');
}

export function filterLockers(
  rows: LockerListItem[],
  query: Pick<GetLockersQuery, 'search' | 'shape' | 'sort_by' | 'sort_order'>,
): LockerListItem[] {
  const { search, shape, sort_by = 'locker_id', sort_order = 'asc' } = query;

  let filtered = [...rows];

  if (search) {
    const searchLower = search.toLowerCase().trim();
    filtered = filtered.filter(
      (row) =>
        row.locker_id.toLowerCase().includes(searchLower) ||
        row.area.toLowerCase().includes(searchLower),
    );
  }

  if (shape) {
    filtered = filtered.filter((row) => row.shape === shape);
  }

  filtered.sort((a, b) => {
    const result = compareLockerValues(a[sort_by], b[sort_by]);
    return sort_order === 'asc' ? result : -result;
  });

  return filtered;
}

export function filterLockerContracts(
  rows: LockerContractListItem[],
  query: Pick<
    GetLockerContractsQuery,
    'search' | 'contract_type' | 'status' | 'sort_by' | 'sort_order'
  >,
): LockerContractListItem[] {
  const { search, contract_type, status, sort_by = 'contract_id', sort_order = 'asc' } = query;

  let filtered = [...rows];

  if (search) {
    const searchLower = search.toLowerCase().trim();
    filtered = filtered.filter(
      (row) =>
        row.contract_id.toLowerCase().includes(searchLower) ||
        row.member_name.toLowerCase().includes(searchLower),
    );
  }

  if (contract_type) {
    filtered = filtered.filter((row) => row.contract_type === contract_type);
  }

  if (status) {
    filtered = filtered.filter((row) => row.status === status);
  }

  filtered.sort((a, b) => {
    const result = compareLockerValues(a[sort_by], b[sort_by]);
    return sort_order === 'asc' ? result : -result;
  });

  return filtered;
}

export function filterLockerPendingSlots(
  rows: LockerPendingSlotListItem[],
  query: Pick<
    GetLockerPendingSlotsQuery,
    | 'search'
    | 'store_id'
    | 'locker_location'
    | 'cancel_date_from'
    | 'cancel_date_to'
    | 'sort_by'
    | 'sort_order'
  >,
): LockerPendingSlotListItem[] {
  const {
    search,
    store_id,
    locker_location,
    cancel_date_from,
    cancel_date_to,
    sort_by = 'pending_since',
    sort_order = 'asc',
  } = query;

  let filtered = [...rows];

  if (search) {
    const searchLower = search.toLowerCase().trim();
    filtered = filtered.filter(
      (row) =>
        row.slot_number.toLowerCase().includes(searchLower) ||
        row.member_name.toLowerCase().includes(searchLower),
    );
  }

  if (store_id) {
    filtered = filtered.filter((row) => row.store_id === store_id);
  }

  if (locker_location) {
    filtered = filtered.filter((row) => row.locker_location === locker_location);
  }

  if (cancel_date_from) {
    filtered = filtered.filter((row) => row.cancel_date >= cancel_date_from);
  }

  if (cancel_date_to) {
    filtered = filtered.filter((row) => row.cancel_date <= cancel_date_to);
  }

  filtered.sort((a, b) => {
    const result = compareLockerValues(a[sort_by], b[sort_by]);
    return sort_order === 'asc' ? result : -result;
  });

  return filtered;
}
