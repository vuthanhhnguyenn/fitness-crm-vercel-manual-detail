import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';
import { BrandEnumSchema } from './brand.schema';

extendZodWithOpenApi(z);

export const BannerChannelSchema = z.enum(['web', 'mobile']).openapi({
  title: 'BannerChannel',
  description: 'バナー表示チャネル',
});

export const BannerStatusSchema = z.enum(['published', 'out_of_period', 'draft']).openapi({
  title: 'BannerStatus',
  description: 'バナーステータス',
});

export const BannerSortSchema = z.enum(['order', 'title', 'status']).openapi({
  title: 'BannerSortBy',
  description: 'バナー一覧ソートキー',
});

export const BannerDisplayOrderItemSchema = z
  .object({
    id: z.string().min(1).openapi({ example: 'BN-001', description: 'バナーID' }),
    order: z.coerce.number().int().positive().openapi({ example: 1, description: '表示順' }),
  })
  .openapi({
    title: 'BannerDisplayOrderItem',
    description: '表示順更新アイテム',
  });

// -- Seed schemas --

export const BannerSchema = z
  .object({
    id: z.string().openapi({ example: 'BN-001', description: 'バナーID' }),
    order: z.number().int().positive().openapi({ example: 1, description: '表示順' }),
    image_url: z.string().openapi({
      example: 'https://example.com/banner-1.png',
      description: '画像URL',
    }),
    title: z.string().openapi({ example: '春の入会キャンペーン', description: 'タイトル' }),
    link_url: z.string().nullable().openapi({
      example: 'https://example.com/campaign/spring',
      description: 'リンクURL',
    }),
    period_start: z.string().openapi({
      example: '2026/04/01',
      description: '表示開始日 (YYYY/MM/DD)',
    }),
    period_end: z.string().openapi({
      example: '2026/04/30',
      description: '表示終了日 (YYYY/MM/DD)',
    }),
    web_enabled: z.boolean().openapi({ example: true, description: 'Web表示有効' }),
    mobile_enabled: z.boolean().openapi({ example: true, description: 'Mobile表示有効' }),
  })
  .openapi({
    title: 'Banner',
    description: 'バナー一覧アイテム',
  });

export const BannerBrandMapEntrySchema = z
  .object({
    banner_id: BannerSchema.shape.id,
    brand_enum: BrandEnumSchema,
  })
  .openapi({
    title: 'BannerBrandMapEntry',
    description: 'バナーとブランドの関連情報',
  });

// -- Request schemas --

export const GetBannersQueryParamsSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .refine(
        (value) => [25, 50, 100, 200].includes(value),
        'limit must be one of 25, 50, 100, 200',
      )
      .default(50),
    query: z.string().optional().openapi({
      description: 'タイトル部分一致検索 (大文字小文字を区別しない)',
    }),
    brandEnum: BrandEnumSchema.nullable().optional(),
    channel: BannerChannelSchema.nullable().optional(),
    status: BannerStatusSchema.nullable().optional(),
    sort: BannerSortSchema.default('order'),
    order: z.enum(['asc', 'desc']).default('asc'),
  })
  .openapi({
    title: 'GetBannersQueryParams',
    description: 'バナー一覧取得クエリ',
  });

export const PatchBannersDisplayOrderRequestSchema = z
  .object({
    banners: z.array(BannerDisplayOrderItemSchema).min(1),
  })
  .openapi({
    title: 'PatchBannersDisplayOrderRequest',
    description: 'バナー表示順更新リクエスト',
  });

export const CreateBannerBodySchema = z
  .object({
    title: z.string().min(1).max(255).openapi({ description: 'タイトル' }),
    imageUrl: z.string().min(1).openapi({ description: '画像URL' }),
    brandEnum: z.array(BrandEnumSchema).min(1),
    linkUrl: z.url().nullable().optional().openapi({ description: 'リンクURL' }),
    periodStart: z.string().openapi({ description: '掲載開始日 (YYYY/MM/DD)' }),
    periodEnd: z.string().nullable().optional().openapi({ description: '掲載終了日 (YYYY/MM/DD)' }),
    webEnabled: z.boolean().openapi({ description: 'WEB表示', example: true }),
    mobileEnabled: z.boolean().openapi({ description: 'モバイル表示', example: true }),
    order: z.number().int().positive().optional().openapi({ description: '表示順' }),
  })
  .openapi({
    title: 'CreateBannerBody',
    description: 'バナー作成リクエスト',
  });

export const UpdateBannerBodySchema = CreateBannerBodySchema.partial().openapi({
  title: 'UpdateBannerBody',
  description: 'バナー更新リクエスト',
});

// -- Response schemas --

export const BannerItemResponseSchema = z.object({
  id: BannerSchema.shape.id,
  order: BannerSchema.shape.order,
  imageUrl: BannerSchema.shape.image_url,
  title: BannerSchema.shape.title,
  linkUrl: BannerSchema.shape.link_url,
  periodStart: BannerSchema.shape.period_start,
  periodEnd: BannerSchema.shape.period_end,
  webEnabled: BannerSchema.shape.web_enabled,
  mobileEnabled: BannerSchema.shape.mobile_enabled,
  brandEnum: z.array(BrandEnumSchema).openapi({
    example: ['Joyfit'],
    description: '関連ブランド一覧',
  }),
  status: BannerStatusSchema.openapi({ description: '公開ステータス' }),
});

export const GetBannersResponseSchema = z
  .object({
    items: z.array(BannerItemResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi({
    title: 'GetBannersResponse',
    description: 'バナー一覧レスポンス',
  });

export const PatchBannersDisplayOrderResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'バナーの並び順を更新しました' }),
    banners: z.array(BannerDisplayOrderItemSchema),
  })
  .openapi({
    title: 'PatchBannersDisplayOrderResponse',
    description: 'バナー表示順更新レスポンス',
  });

export const DeleteBannerResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'バナーを削除しました' }),
    id: z.string().openapi({ example: 'BN-001' }),
  })
  .openapi({
    title: 'DeleteBannerResponse',
    description: 'バナー削除レスポンス',
  });

export const CreateBannerResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'バナーを登録しました' }),
    banner: BannerItemResponseSchema,
  })
  .openapi({
    title: 'CreateBannerResponse',
    description: 'バナー作成レスポンス',
  });

export const UpdateBannerResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'バナーの変更を保存しました' }),
    banner: BannerItemResponseSchema,
  })
  .openapi({
    title: 'UpdateBannerResponse',
    description: 'バナー更新レスポンス',
  });

export type BannerChannel = z.infer<typeof BannerChannelSchema>;
export type BannerStatus = z.infer<typeof BannerStatusSchema>;
export type BannerSort = z.infer<typeof BannerSortSchema>;
export type Banner = z.infer<typeof BannerSchema>;
export type BannerBrandMapEntry = z.infer<typeof BannerBrandMapEntrySchema>;
export type GetBannersQueryParams = z.infer<typeof GetBannersQueryParamsSchema>;
export type BannerDisplayOrderItem = z.infer<typeof BannerDisplayOrderItemSchema>;
export type BannerItemResponse = z.infer<typeof BannerItemResponseSchema>;
export type CreateBannerBody = z.infer<typeof CreateBannerBodySchema>;
export type UpdateBannerBody = z.infer<typeof UpdateBannerBodySchema>;

export { ErrorResponseSchema };
