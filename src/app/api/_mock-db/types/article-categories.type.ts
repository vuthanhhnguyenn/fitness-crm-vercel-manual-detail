import type {
  ArticleCategory,
  ArticleCategoryMapping,
  CreateArticleCategoryBody,
  UpdateArticleCategoryBody,
} from '@/app/api/_schemas/article-category.schema';

export type ArticleCategoriesType = {
  _rows: ArticleCategory[];
  _seeded: boolean;
  _seed(): void;
  getList(): ArticleCategory[];
  getById(id: string): ArticleCategory | undefined;
  delete(id: string): boolean;
  create(data: CreateArticleCategoryBody): ArticleCategory;
  update(id: string, data: UpdateArticleCategoryBody): ArticleCategory | undefined;
};

export type ArticleCategoryMappingsType = {
  _rows: ArticleCategoryMapping[];
  _seeded: boolean;
  _seed(): void;
  countByCategoryId(categoryId: string): number;
  reassignCategory(fromCategoryId: string, toCategoryId: string): void;
};
