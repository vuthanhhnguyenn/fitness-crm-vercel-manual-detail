import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const RoutineCategorySchema = z
  .object({
    id: z.string().openapi({ example: 'RC-001' }),
    name: z.string().openapi({ example: 'ビギナー向け' }),
    sortOrder: z.number().int().openapi({ example: 1 }),
  })
  .openapi({
    title: 'RoutineCategory',
    description: 'ルーティンカテゴリ',
  });

export const GetRoutineCategoriesResponseSchema = z
  .object({
    items: z.array(RoutineCategorySchema),
  })
  .openapi({
    title: 'GetRoutineCategoriesResponse',
    description: 'ルーティンカテゴリ一覧レスポンス',
  });

export type RoutineCategory = z.infer<typeof RoutineCategorySchema>;
export type GetRoutineCategoriesResponse = z.infer<typeof GetRoutineCategoriesResponseSchema>;
