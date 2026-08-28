import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { enrichBanner } from '@/app/api/_mock-db/tables/banner.table';
import type { BannerItemResponse, GetBannersQueryParams } from '@/app/api/_schemas/banner.schema';
import {
  CreateBannerBodySchema,
  CreateBannerResponseSchema,
  ErrorResponseSchema,
  GetBannersQueryParamsSchema,
  GetBannersResponseSchema,
} from '@/app/api/_schemas/banner.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/banners',
  summary: 'Get banners',
  description: 'Get paginated banners list with search, filters, and sorting',
  tags: ['Banners'],
  query: GetBannersQueryParamsSchema,
  responses: [
    {
      status: 200,
      schema: GetBannersResponseSchema,
      description: 'Banner list',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
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
    const queryObj: Record<string, string | undefined> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      queryObj[key] = value;
    });

    const validationResult = GetBannersQueryParamsSchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetBannersQueryParams = validationResult.data;
    const { page, limit, query: search, brandEnum, channel, status, sort, order } = query;

    let banners: BannerItemResponse[] = db.banners
      .getList()
      .map((banner) => enrichBanner(banner, db.banners.getBrandEnum(banner.id)));

    if (search) {
      const normalizedSearch = search.toLowerCase().trim();
      banners = banners.filter((banner) => banner.title.toLowerCase().includes(normalizedSearch));
    }

    if (brandEnum) {
      banners = banners.filter((banner) => banner.brandEnum.some((b) => b === brandEnum));
    }

    if (channel === 'web') {
      banners = banners.filter((banner) => banner.webEnabled);
    }
    if (channel === 'mobile') {
      banners = banners.filter((banner) => banner.mobileEnabled);
    }

    if (status) {
      banners = banners.filter((banner) => banner.status === status);
    }

    banners = [...banners].sort((left, right) => {
      let comparison = 0;
      if (sort === 'order') {
        comparison = left.order - right.order;
      } else if (sort === 'title') {
        comparison = left.title.localeCompare(right.title, 'ja');
      } else {
        comparison = left.status.localeCompare(right.status, 'ja');
      }
      return order === 'desc' ? -comparison : comparison;
    });

    const totalItems = banners.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginated = banners.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      items: paginated,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /crm/banners error:', error);
    return NextResponse.json({ error: 'バナー一覧の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'post',
  path: '/crm/banners',
  summary: 'Create banner',
  description: 'Create a new banner',
  tags: ['Banners'],
  requestBody: {
    schema: CreateBannerBodySchema,
    description: 'Banner create payload',
  },
  responses: [
    {
      status: 200,
      schema: CreateBannerResponseSchema,
      description: 'Banner created',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Validation error',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = CreateBannerBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const banner = enrichBanner(
      db.banners.add(validationResult.data),
      validationResult.data.brandEnum,
    );
    return NextResponse.json({ message: 'バナーを登録しました', banner }, { status: 200 });
  } catch (error) {
    console.error('POST /crm/banners error:', error);
    return NextResponse.json({ error: 'バナーの作成に失敗しました' }, { status: 500 });
  }
}
