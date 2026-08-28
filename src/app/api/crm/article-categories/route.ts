import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { enrichArticleCategory } from '@/app/api/_mock-db/tables/article-category.table';
import {
  ArticleCategoryItemResponseSchema,
  ArticleCategoryResponseItem,
  CreateArticleCategoryBodySchema,
  ErrorResponseSchema,
  GetArticleCategoriesQueryParams,
  GetArticleCategoriesQueryParamsSchema,
  GetArticleCategoriesResponseSchema,
} from '@/app/api/_schemas/article-category.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/article-categories',
  summary: 'Get article categories',
  description: 'Get paginated article category master list with search, filters, and sorting',
  tags: ['ArticleCategories'],
  query: GetArticleCategoriesQueryParamsSchema,
  responses: [
    {
      status: 200,
      schema: GetArticleCategoriesResponseSchema,
      description: 'Article category list',
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

    const validationResult = GetArticleCategoriesQueryParamsSchema.safeParse(queryObj);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const query: GetArticleCategoriesQueryParams = validationResult.data;
    const { page, limit, query: search, type, brandEnum, isPublic, sort, order } = query;

    let items: ArticleCategoryResponseItem[] = db.articleCategories
      .getList()
      .map((category) =>
        enrichArticleCategory(category, db.articleCategoryMappings.countByCategoryId(category.id)),
      );
    const totalAllItems = items.length;

    if (search) {
      const normalizedSearch = search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch),
      );
    }

    if (type) {
      items = items.filter((item) => item.type === type);
    }

    if (brandEnum) {
      items = items.filter((item) => item.brandEnum === brandEnum);
    }

    if (isPublic !== undefined) {
      items = items.filter((item) => item.isPublic === isPublic);
    }

    if (sort && order) {
      items = [...items].sort((left, right) => {
        let comparison = 0;
        if (sort === 'name') {
          comparison = left.name.localeCompare(right.name, 'ja');
        } else if (sort === 'order') {
          comparison = left.order - right.order;
        } else {
          comparison = left.articleCount - right.articleCount;
        }
        return order === 'desc' ? -comparison : comparison;
      });
    }

    const totalItems = items.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      items: paginated,
      totalAllItems,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /crm/article-categories error:', error);
    return NextResponse.json({ error: 'カテゴリ一覧の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'post',
  path: '/crm/article-categories',
  summary: 'Create article category',
  description: 'Create a new article category',
  tags: ['ArticleCategories'],
  requestBody: {
    schema: CreateArticleCategoryBodySchema,
    description: 'Article category create payload',
  },
  responses: [
    {
      status: 200,
      schema: ArticleCategoryItemResponseSchema,
      description: 'Article category created',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = CreateArticleCategoryBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const category = db.articleCategories.create(validationResult.data);
    return NextResponse.json(enrichArticleCategory(category, 0));
  } catch (error) {
    console.error('POST /crm/article-categories error:', error);
    return NextResponse.json({ error: 'カテゴリの作成に失敗しました' }, { status: 500 });
  }
}
