import type {
  ArticleCategoryItemResponse,
  CreateArticleCategoryBody,
  UpdateArticleCategoryBody,
} from '@/lib/api/types.gen';

import type {
  ArticleCategoryFormSubmitValues,
  ArticleCategoryFormValues,
} from './article-category-form.schema';

export function articleCategoryDetailToFormValues(
  category: ArticleCategoryItemResponse,
): ArticleCategoryFormValues {
  return {
    name: category.name,
    description: category.description,
    type: category.type,
    brandEnum: category.brandEnum,
    order: category.order,
    isPublic: category.isPublic,
  };
}

export function articleCategoryFormValuesToCreateBody(
  values: ArticleCategoryFormSubmitValues,
): NonNullable<CreateArticleCategoryBody> {
  return {
    name: values.name,
    description: values.description,
    type: values.type,
    brandEnum: values.brandEnum,
    order: values.order,
    isPublic: values.isPublic,
  };
}

export function articleCategoryFormValuesToUpdateBody(
  values: ArticleCategoryFormSubmitValues,
): NonNullable<UpdateArticleCategoryBody> {
  return {
    name: values.name,
    description: values.description,
    type: values.type,
    brandEnum: values.brandEnum,
    order: values.order,
    isPublic: values.isPublic,
  };
}
