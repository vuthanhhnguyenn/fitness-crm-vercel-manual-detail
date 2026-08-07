import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  CreateMemberRequestSchema,
  type CreateMemberResponse,
  CreateMemberResponseSchema,
  ErrorResponseSchema,
  type GetMembersQuery,
  GetMembersQuerySchema,
  type GetMembersResponse,
  GetMembersResponseSchema,
} from '@/app/api/_schemas/member.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

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

registerRoute({
  method: 'post',
  path: '/crm/members',
  summary: 'Create member',
  description: 'Create a new member',
  tags: ['Members'],
  requestBody: {
    schema: CreateMemberRequestSchema,
    description: 'Member create payload',
  },
  responses: [
    {
      status: 200,
      schema: CreateMemberResponseSchema,
      description: 'Member created successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - invalid request body',
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
      status,
      brand,
      store_id,
      last_visit_days,
      has_unpaid,
      sort_by = 'member_number',
      sort_order = 'asc',
    } = query;

    // Get data from shared mock DB
    const allMembers = db.members.getList();

    // Apply filters
    let filtered = allMembers;

    if (search) {
      const searchLower = search.toLowerCase().trim();
      const searchNorm = search.trim();
      filtered = filtered.filter(
        (m) =>
          m.member_number.toLowerCase().includes(searchLower) ||
          m.old_member_number.toLowerCase().includes(searchLower) ||
          m.name_kanji.includes(search) ||
          m.name_kana.includes(search) ||
          m.name_kanji.includes(searchNorm) ||
          m.name_kana.includes(searchNorm) ||
          (m.phone && m.phone.replace(/-/g, '').includes(search.replace(/-/g, ''))) ||
          (m.email && m.email.toLowerCase().includes(searchLower)),
      );
    }

    if (contract_type && contract_type.length > 0) {
      filtered = filtered.filter((m) => contract_type.includes(m.contract_type));
    }

    if (status && status.length > 0) {
      filtered = filtered.filter((m) => status.includes(m.status));
    }

    if (brand && brand.length > 0) {
      filtered = filtered.filter((m) => brand.includes(m.brand));
    }

    if (store_id && store_id.length > 0) {
      // Mock filter by store - in real app, filter by store_id
      filtered = filtered.filter((m) => store_id.some((id) => m.store_id?.includes(id)));
    }

    if (last_visit_days !== undefined) {
      const now = new Date();
      if (last_visit_days === -1) {
        // 3ヶ月以上 (90+ days)
        const cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (m) => !m.last_visit_date || new Date(m.last_visit_date) < cutoffDate,
        );
      } else {
        // Within X days
        const cutoffDate = new Date(now.getTime() - last_visit_days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (m) => m.last_visit_date && new Date(m.last_visit_date) >= cutoffDate,
        );
      }
    }

    if (has_unpaid !== undefined) {
      filtered = filtered.filter((m) => m.has_unpaid === has_unpaid);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sort_by) {
        case 'member_number':
          comparison = a.member_number.localeCompare(b.member_number);
          break;
        case 'joined_at':
          comparison = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
          break;
        case 'last_visit_date':
          const aDate = a.last_visit_date ? new Date(a.last_visit_date).getTime() : 0;
          const bDate = b.last_visit_date ? new Date(b.last_visit_date).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'name':
          comparison = a.name_kanji.localeCompare(b.name_kanji);
          break;
      }
      return sort_order === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMembers = filtered.slice(startIndex, endIndex);

    const response: GetMembersResponse = {
      members: paginatedMembers,
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateMemberRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const member = db.members.create(validationResult.data);

    const response: CreateMemberResponse = {
      message: 'Member created successfully',
      member: member.basic_info,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
