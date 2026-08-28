import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';
import { BrandEnumSchema } from './brand.schema';

extendZodWithOpenApi(z);

export const ArticleCategoryTypeSchema = z.enum(['notice', 'blog']).openapi({
  title: 'ArticleCategoryType',
  description: '記事カテゴリー種別',
});

export const ArticleCategorySortSchema = z.enum(['name', 'order', 'articleCount']).openapi({
  title: 'ArticleCategorySortBy',
  description: '記事カテゴリー一覧ソートキー',
});

export const ArticleCategorySchema = z
  .object({
    id: z.string().openapi({ example: 'CAT-001', description: 'カテゴリID' }),
    name: z
      .string()
      .min(1)
      .openapi({ example: 'キャンペーン・イベント', description: 'カテゴリ名' }),
    description: z
      .string()
      .openapi({ example: '入会キャンペーンや店舗イベント情報', description: '説明' }),
    type: ArticleCategoryTypeSchema,
    brand_enum: BrandEnumSchema.openapi({
      example: 'joyfit',
      description: 'ブランド種別',
    }),
    order: z.number().int().nonnegative().openapi({ example: 1, description: '表示順' }),
    is_public: z.boolean().openapi({ example: true, description: '公開状況' }),
  })
  .openapi({
    title: 'ArticleCategory',
    description: '記事カテゴリー',
  });

export const ArticleCategoryMappingSchema = z
  .object({
    article_id: z.string().openapi({ example: 'ART-0001', description: '記事ID（仮）' }),
    category_id: z.string().openapi({ example: 'CAT-001', description: 'カテゴリID' }),
  })
  .openapi({
    title: 'ArticleCategoryMapping',
    description: '記事とカテゴリの関連情報',
  });

export const ArticleCategoryItemResponseSchema = z
  .object({
    id: ArticleCategorySchema.shape.id,
    name: ArticleCategorySchema.shape.name,
    description: ArticleCategorySchema.shape.description,
    type: ArticleCategorySchema.shape.type,
    brandEnum: ArticleCategorySchema.shape.brand_enum,
    order: ArticleCategorySchema.shape.order,
    isPublic: ArticleCategorySchema.shape.is_public,
    articleCount: z
      .number()
      .int()
      .nonnegative()
      .openapi({ example: 12, description: '紐づく記事数' }),
  })
  .openapi({
    title: 'ArticleCategoryResponseItem',
    description: '記事カテゴリー一覧アイテム',
  });

export const CreateArticleCategoryBodySchema = z
  .object({
    name: ArticleCategorySchema.shape.name,
    description: ArticleCategorySchema.shape.description.default(''),
    type: ArticleCategoryTypeSchema,
    brandEnum: BrandEnumSchema,
    order: z.number().int().min(1).max(999).default(1),
    isPublic: z.boolean().default(true),
  })
  .openapi({
    title: 'CreateArticleCategoryBody',
    description: '記事カテゴリー作成リクエスト',
  });

export const UpdateArticleCategoryBodySchema = CreateArticleCategoryBodySchema.partial().openapi({
  title: 'UpdateArticleCategoryBody',
  description: '記事カテゴリー更新リクエスト',
});

export const GetArticleCategoriesQueryParamsSchema = z
  .object({
    query: z
      .string()
      .optional()
      .openapi({ description: 'カテゴリ名・説明 部分一致検索 (大文字小文字を区別しない)' }),
    type: ArticleCategoryTypeSchema.nullable().optional(),
    brandEnum: BrandEnumSchema.nullable().optional(),
    isPublic: z.preprocess((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    }, z.boolean().nullable().optional()),
    sort: ArticleCategorySortSchema.optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .refine(
        (value) => [25, 50, 100, 200].includes(value),
        'limit must be one of 25, 50, 100, 200',
      )
      .default(50),
  })
  .openapi({
    title: 'GetArticleCategoriesQuery',
    description: '記事カテゴリー一覧取得クエリ',
  });

export const GetArticleCategoriesResponseSchema = z
  .object({
    items: z.array(ArticleCategoryItemResponseSchema),
    totalAllItems: z.number().int().nonnegative().openapi({
      example: 100,
      description: '全件数（ページネーション対象外）',
    }),
    pagination: z.object({
      page: z.number().int().min(1),
      limit: z.number().int(),
      totalItems: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  })
  .openapi({
    title: 'GetArticleCategoriesResponse',
    description: '記事カテゴリー一覧レスポンス',
  });

export const DeleteArticleCategoryResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'カテゴリを削除しました' }),
  })
  .openapi({
    title: 'DeleteArticleCategoryResponse',
    description: '記事カテゴリー削除レスポンス',
  });

export type ArticleCategoryType = z.infer<typeof ArticleCategoryTypeSchema>;
export type ArticleCategorySort = z.infer<typeof ArticleCategorySortSchema>;
export type ArticleCategory = z.infer<typeof ArticleCategorySchema>;
export type ArticleCategoryMapping = z.infer<typeof ArticleCategoryMappingSchema>;
export type ArticleCategoryResponseItem = z.infer<typeof ArticleCategoryItemResponseSchema>;
export type CreateArticleCategoryBody = z.infer<typeof CreateArticleCategoryBodySchema>;
export type UpdateArticleCategoryBody = z.infer<typeof UpdateArticleCategoryBodySchema>;
export type GetArticleCategoriesQueryParams = z.infer<typeof GetArticleCategoriesQueryParamsSchema>;
export type GetArticleCategoriesResponse = z.infer<typeof GetArticleCategoriesResponseSchema>;
export type DeleteArticleCategoryResponse = z.infer<typeof DeleteArticleCategoryResponseSchema>;

export { ErrorResponseSchema };
