import {
  SEED_ARTICLE_CATEGORY_MAPPINGS,
  SEED_ARTICLE_CATEGORY_ROWS,
} from '@/app/api/_mock-db/seeds/article-category.seed';
import type {
  ArticleCategory,
  ArticleCategoryMapping,
  ArticleCategoryResponseItem,
  CreateArticleCategoryBody,
  UpdateArticleCategoryBody,
} from '@/app/api/_schemas/article-category.schema';

export function enrichArticleCategory(
  category: ArticleCategory,
  articleCount: number,
): ArticleCategoryResponseItem {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    type: category.type,
    order: category.order,
    isPublic: category.is_public,
    brandEnum: category.brand_enum,
    articleCount: articleCount,
  };
}

export function createArticleCategoryTables() {
  return {
    articleCategories: {
      _rows: [] as ArticleCategory[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_ARTICLE_CATEGORY_ROWS];
      },
      getList(): ArticleCategory[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): ArticleCategory | undefined {
        this._seed();
        return this._rows.find((category) => category.id === id);
      },
      delete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((category) => category.id === id);
        if (index === -1) return false;
        this._rows.splice(index, 1);
        return true;
      },
      create(data: CreateArticleCategoryBody): ArticleCategory {
        this._seed();
        const ids = this._rows
          .map((category) => Number(category.id.replace('CAT-', '')))
          .filter((n) => !Number.isNaN(n));
        const nextNumber = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        const category: ArticleCategory = {
          id: `CAT-${String(nextNumber).padStart(3, '0')}`,
          name: data.name,
          description: data.description ?? '',
          type: data.type,
          brand_enum: data.brandEnum,
          order: data.order ?? 1,
          is_public: data.isPublic ?? true,
        };
        this._rows.push(category);
        return category;
      },
      update(id: string, data: UpdateArticleCategoryBody): ArticleCategory | undefined {
        this._seed();
        const index = this._rows.findIndex((category) => category.id === id);
        if (index === -1) return undefined;
        const current = this._rows[index];
        const updated: ArticleCategory = {
          ...current,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.brandEnum !== undefined && { brand_enum: data.brandEnum }),
          ...(data.order !== undefined && { order: data.order }),
          ...(data.isPublic !== undefined && { is_public: data.isPublic }),
        };
        this._rows[index] = updated;
        return updated;
      },
    },
    articleCategoryMappings: {
      _rows: [] as ArticleCategoryMapping[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_ARTICLE_CATEGORY_MAPPINGS];
      },
      countByCategoryId(categoryId: string): number {
        this._seed();
        return this._rows.filter((mapping) => mapping.category_id === categoryId).length;
      },
      reassignCategory(fromCategoryId: string, toCategoryId: string): void {
        this._seed();
        this._rows = this._rows.map((mapping) =>
          mapping.category_id === fromCategoryId
            ? { ...mapping, category_id: toCategoryId }
            : mapping,
        );
      },
    },
  };
}
