import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type GetMembersQuery,
  GetMembersQuerySchema,
  type GetMembersResponse,
  GetMembersResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Member status enum order — used for the `status` sort key (mirrors the
// PostgreSQL `member_status` enum order in the backend design).
const MEMBER_STATUS_SORT_ORDER = [
  'provisional',
  'active',
  'pending_suspended',
  'suspended',
  'pending_withdrawal',
  'withdrawal_pending_processing',
  'withdrawn',
  'forced_withdrawal',
] as const;

/**
 * NFKC-normalizes and lower-cases a value before matching, so a query typed with
 * full-width digits/latin (`０９０`, `ＡＢＣ`) or half-width kana (`ﾀﾅｶ`) matches the
 * stored half-width / full-width form and vice versa (FR-002, i18n width handling).
 */
function normalizeSearchValue(value: string): string {
  return value.normalize('NFKC').toLowerCase().trim();
}

/** Phone numbers are matched digits-only, so separators never break a match. */
function stripPhoneSeparators(value: string): string {
  return value.replace(/[-\s()]/g, '');
}

/** Timestamp for sorting, or `null` when the value is missing/unparsable. */
function toSortableTime(value?: string): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

// Register OpenAPI documentation for this route
registerRoute({
  method: 'get',
  path: '/crm/members',
  summary: 'Get members list',
  description: 'Get paginated list of members with filtering and sorting',
  tags: ['Members'],
  query: GetMembersQuerySchema,
  responses: [
    {
      status: 200,
      schema: GetMembersResponseSchema,
      description: 'List of members',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid query parameters',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build query object from searchParams
    const queryObj: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    // Validate query parameters with Zod
    const validationResult = GetMembersQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetMembersQuery = validationResult.data;
    const {
      page,
      limit,
      search = '',
      contract_type,
      main_contract_id,
      status,
      brand_group,
      store_id,
      enrolled_from,
      enrolled_to,
      last_entry_from,
      last_entry_to,
      include_never_entered,
      promo_code,
      has_unpaid,
      has_gate_stop,
      sort_by = 'member_number',
      sort_order = 'asc',
      match_mode = 'substring',
    } = query;

    // Get data from shared mock DB
    const allMembers = db.members.getList();

    // Apply filters
    let filtered = allMembers;

    const searchQuery = normalizeSearchValue(search);
    if (searchQuery) {
      const queryDigits = stripPhoneSeparators(searchQuery);
      /**
       * A-01 FR-038a — `prefix` mirrors the real endpoint, whose member search is
       * `ILIKE 'kw%'` on every field except the two unique keys, which match exactly.
       * The blacklist registration Sheet opts into it so it behaves identically against
       * the mock and the live API.
       *
       * Opt-in, never the default: this route also backs A-01's own member list and
       * several pickers, and switching their matching would change all of them silently
       * (research §4).
       */
      const isPrefix = match_mode === 'prefix';
      const matches = (value: string | undefined, exact: boolean) => {
        if (!value) return false;
        const v = normalizeSearchValue(value);
        if (!isPrefix) return v.includes(searchQuery);
        return exact ? v === searchQuery : v.startsWith(searchQuery);
      };

      filtered = filtered.filter((m) => {
        const textMatch =
          matches(m.member_number, isPrefix) ||
          matches(m.old_member_number, isPrefix) ||
          matches(m.name_kanji, false) ||
          matches(m.name_kana, false) ||
          matches(m.email, false);
        if (textMatch) return true;
        const phone = m.phone ? stripPhoneSeparators(normalizeSearchValue(m.phone)) : '';
        if (!phone || !queryDigits) return false;
        return isPrefix ? phone.startsWith(queryDigits) : phone.includes(queryDigits);
      });
    }

    if (contract_type && contract_type.length > 0) {
      filtered = filtered.filter((m) => contract_type.includes(m.contract_type));
    }

    if (main_contract_id && main_contract_id.length > 0) {
      filtered = filtered.filter((m) => main_contract_id.includes(m.contract_id));
    }

    if (status && status.length > 0) {
      filtered = filtered.filter((m) => status.includes(m.status));
    }

    if (brand_group && brand_group.length > 0) {
      filtered = filtered.filter((m) => brand_group.includes(m.brand_group));
    }

    if (store_id && store_id.length > 0) {
      // Mock filter by store - in real app, filter by store_id
      filtered = filtered.filter((m) => store_id.some((id) => m.store_id?.includes(id)));
    }

    // 入会日 range. A member with no join date can never satisfy a bound — matching
    // the backend rule that members without a resolvable main contract drop out of
    // the result as soon as any contract/enrolment filter is applied.
    if (enrolled_from) {
      filtered = filtered.filter((m) => !!m.joined_at && m.joined_at >= enrolled_from);
    }
    if (enrolled_to) {
      filtered = filtered.filter((m) => !!m.joined_at && m.joined_at <= enrolled_to);
    }

    // 最終来館日 range. `include_never_entered` keeps members who have never entered,
    // which the 「3週間以上来館なし」/「1ヶ月以上来館なし」 buckets rely on.
    if (last_entry_from || last_entry_to) {
      filtered = filtered.filter((m) => {
        if (!m.last_visit_date) return include_never_entered === true;
        if (last_entry_from && m.last_visit_date < last_entry_from) return false;
        if (last_entry_to && m.last_visit_date > last_entry_to) return false;
        return true;
      });
    }

    if (promo_code) {
      filtered = filtered.filter((m) => m.promotion_code === promo_code);
    }

    if (has_unpaid !== undefined) {
      filtered = filtered.filter((m) => m.has_unpaid === has_unpaid);
    }

    // Gate stop is its own axis, so it AND-combines with `status` instead of being
    // one of its values.
    if (has_gate_stop !== undefined) {
      filtered = filtered.filter((m) => m.has_gate_stop === has_gate_stop);
    }

    // Apply sorting. Sorting on a copy so the shared mock roster keeps its own order.
    const sortKeyOf = (m: (typeof filtered)[number]): string | number | null => {
      switch (sort_by) {
        case 'member_number':
          return m.member_number || null;
        case 'joined_at':
          return toSortableTime(m.joined_at);
        case 'last_visit_date':
          return toSortableTime(m.last_visit_date);
        case 'name':
          return m.name_kanji || null;
        case 'status': {
          // Sort by the member_status enum order (matches backend `memberStatus` sort)
          const index = MEMBER_STATUS_SORT_ORDER.indexOf(m.status);
          return index === -1 ? null : index;
        }
        default:
          return null;
      }
    };
    filtered = [...filtered].sort((a, b) => {
      const aKey = sortKeyOf(a);
      const bKey = sortKeyOf(b);
      // Rows missing the sorted attribute go to the END in both directions
      // (A-01 edge case "Missing sort values"), so the direction sign is not applied.
      if (aKey === null || bKey === null) {
        if (aKey === null && bKey === null) return 0;
        return aKey === null ? 1 : -1;
      }
      const comparison =
        typeof aKey === 'number' && typeof bKey === 'number'
          ? aKey - bKey
          : String(aKey).localeCompare(String(bKey));
      return sort_order === 'asc' ? comparison : -comparison;
    });

    // Apply pagination. A requested page beyond the last valid page falls back to
    // that last page instead of returning an empty slice (A-01 edge case
    // "Requested page out of range"); the clamped page is echoed back so the
    // client can align its URL/footer with the rows it actually received.
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const currentPage = Math.min(Math.max(page, 1), Math.max(total_pages, 1));
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    /**
     * A-01 FR-050a — `has_blacklist` needs the blacklist table, which the list-item
     * mapper has no access to, so it is projected here. HQ / system only, matching the
     * real contract's restriction on the same field.
     */
    const paginatedMembers = filtered.slice(startIndex, endIndex).map((m) => ({
      ...m,
      has_blacklist: db.memberBlacklist.hasActiveForMember(m.id),
    }));

    const response: GetMembersResponse = {
      members: paginatedMembers,
      pagination: {
        page: currentPage,
        limit,
        total,
        total_pages,
        // Unfiltered in-scope total, so the filter banner can show "全 X 件中 Y 件"
        totalAllItems: allMembers.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
