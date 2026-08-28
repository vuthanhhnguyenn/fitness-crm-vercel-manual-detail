import { ArticleCategoryType } from '@/lib/api/types.gen';

export const ARTICLE_CATEGORY_DEFAULT_PAGE_SIZE = 50;

export const ARTICLE_CATEGORY_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const PUBLISH_STATUS_LABELS = {
  true: '公開',
  false: '非公開',
};

export const PUBLISH_STATUS_BADGE_CLASSES = {
  true: 'bg-success/15 text-success border-success/20',
  false: 'bg-muted text-muted-foreground border-border',
};

export const ARTICLE_CATEGORY_TYPE_LABELS = {
  [ArticleCategoryType.NOTICE]: 'お知らせ',
  [ArticleCategoryType.BLOG]: 'ブログ',
};

export const ARTICLE_CATEGORY_TYPE_BADGE_CLASSES: Record<ArticleCategoryType, string> = {
  [ArticleCategoryType.NOTICE]: 'bg-info/15 text-info border-info/20',
  [ArticleCategoryType.BLOG]: 'bg-secondary text-secondary-foreground border-border',
};
