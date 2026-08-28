import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import { UNCLASSIFIED_CATEGORY_ID } from '@/app/api/_mock-db/seeds/article-category.seed';
import { enrichArticleCategory } from '@/app/api/_mock-db/tables/article-category.table';
import {
  ArticleCategoryItemResponseSchema,
  DeleteArticleCategoryResponseSchema,
  ErrorResponseSchema,
  UpdateArticleCategoryBodySchema,
} from '@/app/api/_schemas/article-category.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/article-categories/{id}',
  summary: 'Get article category by ID',
  description: 'Fetch a single article category for edit pre-fill',
  tags: ['ArticleCategories'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Article category ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: ArticleCategoryItemResponseSchema,
      description: 'Article category detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Article category not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = db.articleCategories.getById(id);

    if (!category) {
      return NextResponse.json({ error: 'カテゴリが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      enrichArticleCategory(category, db.articleCategoryMappings.countByCategoryId(id)),
    );
  } catch (error) {
    console.error('GET /crm/article-categories/[id] error:', error);
    return NextResponse.json({ error: 'カテゴリ情報の取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'patch',
  path: '/crm/article-categories/{id}',
  summary: 'Update article category',
  description: 'Partial update of an article category by ID',
  tags: ['ArticleCategories'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Article category ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateArticleCategoryBodySchema,
    description: 'Article category update payload',
  },
  responses: [
    {
      status: 200,
      schema: ArticleCategoryItemResponseSchema,
      description: 'Article category updated',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Validation error',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Article category not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = UpdateArticleCategoryBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.articleCategories.update(id, validationResult.data);
    if (!updated) {
      return NextResponse.json({ error: 'カテゴリが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(
      enrichArticleCategory(updated, db.articleCategoryMappings.countByCategoryId(id)),
    );
  } catch (error) {
    console.error('PATCH /crm/article-categories/[id] error:', error);
    return NextResponse.json({ error: 'カテゴリの更新に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'delete',
  path: '/crm/article-categories/{id}',
  summary: 'Delete article category',
  description: '記事カテゴリーを削除。紐づく記事は「未分類」カテゴリ（CAT-000）に再割り当てされる',
  tags: ['ArticleCategories'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'Article category ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: DeleteArticleCategoryResponseSchema,
      description: 'Article category deleted',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Cannot delete the Unclassified fallback category',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'Article category not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (id === UNCLASSIFIED_CATEGORY_ID) {
      return NextResponse.json({ error: '「未分類」カテゴリは削除できません' }, { status: 400 });
    }

    const category = db.articleCategories.getById(id);
    if (!category) {
      return NextResponse.json({ error: 'カテゴリが見つかりません' }, { status: 404 });
    }

    db.articleCategoryMappings.reassignCategory(id, UNCLASSIFIED_CATEGORY_ID);
    db.articleCategories.delete(id);

    return NextResponse.json({ message: 'カテゴリを削除しました' });
  } catch (error) {
    console.error('DELETE /crm/article-categories/[id] error:', error);
    return NextResponse.json({ error: 'カテゴリの削除に失敗しました' }, { status: 500 });
  }
}
