'use client';

import { use } from 'react';

import { useQuery } from '@tanstack/react-query';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';

import { getCrmArticleCategoriesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { ArticleCategoryForm } from '../../_components/article-category-form/article-category-form';
import { ArticleCategoryFormSkeleton } from '../../_components/article-category-form/article-category-form-skeleton';
import { articleCategoryDetailToFormValues } from '../../_schemas/article-category-form.mapper';

interface ArticleCategoryEditPageProps {
  params: Promise<{ id: string }>;
}

export default function ArticleCategoryEditPage({ params }: ArticleCategoryEditPageProps) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmArticleCategoriesByIdOptions({ path: { id } }),
  );

  if (!data || isLoading || isError) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        onRetry={() => refetch()}
        errorTitle="カテゴリ情報の取得に失敗しました"
        emptyTitle="カテゴリが見つかりません"
        emptyDescription="指定されたカテゴリは存在しないか、削除された可能性があります。"
        skeleton={<ArticleCategoryFormSkeleton />}
      />
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="カテゴリ管理に戻る" href={navigate('/article-categories')} />}
        title="カテゴリ編集"
      />

      <ArticleCategoryForm
        mode="edit"
        defaultValues={articleCategoryDetailToFormValues(data)}
        categoryId={id}
      />
    </>
  );
}
