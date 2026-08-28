'use client';

import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { BRAND_LABELS } from '@/app/(private)/brands/_constants/brand.constants';
import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { FormField } from '@/components/common/form-field';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmArticleCategoriesQueryKey,
  patchCrmArticleCategoriesByIdMutation,
  postCrmArticleCategoriesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { ArticleCategoryType, BrandEnum } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { ARTICLE_CATEGORY_TYPE_LABELS } from '../../_constants/article-category.constants';
import {
  articleCategoryFormValuesToCreateBody,
  articleCategoryFormValuesToUpdateBody,
} from '../../_schemas/article-category-form.mapper';
import {
  ArticleCategoryFormSchema,
  type ArticleCategoryFormSubmitValues,
  type ArticleCategoryFormValues,
  emptyArticleCategoryFormValues,
} from '../../_schemas/article-category-form.schema';

interface ArticleCategoryFormProps {
  mode: 'create' | 'edit';
  defaultValues?: ArticleCategoryFormValues;
  categoryId?: string;
}

export function ArticleCategoryForm({ mode, defaultValues, categoryId }: ArticleCategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<ArticleCategoryFormValues, unknown, ArticleCategoryFormSubmitValues>({
    resolver: zodResolver(ArticleCategoryFormSchema) as never,
    mode: 'onChange',
    defaultValues: defaultValues ?? emptyArticleCategoryFormValues,
  });

  const formErrors = form.formState.errors;

  const navigateToList = useCallback(() => {
    router.push(navigate('/article-categories'));
  }, [router]);

  const invalidateAndNavigate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getCrmArticleCategoriesQueryKey() });
    navigateToList();
  }, [queryClient, navigateToList]);

  const createMutation = useMutation({
    ...postCrmArticleCategoriesMutation(),
    onSuccess: () => {
      toast.success('カテゴリを登録しました');
      invalidateAndNavigate();
    },
    onError: () => {
      toast.error('カテゴリの作成に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...patchCrmArticleCategoriesByIdMutation(),
    onSuccess: () => {
      toast.success('カテゴリの変更を保存しました');
      invalidateAndNavigate();
    },
    onError: () => {
      toast.error('カテゴリの更新に失敗しました');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = form.handleSubmit(
    (values) => {
      if (mode === 'create') {
        createMutation.mutate({ body: articleCategoryFormValuesToCreateBody(values) });
        return;
      }

      if (categoryId) {
        updateMutation.mutate({
          body: articleCategoryFormValuesToUpdateBody(values),
          path: { id: categoryId },
        });
      }
    },
    () => {
      setTimeout(() => {
        const element = document.querySelector("[aria-invalid='true']");
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    },
  );

  return (
    <div className="bg-background flex-1 overflow-y-auto px-6 py-4">
      <div className="mx-auto flex max-w-240 flex-col gap-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex flex-col gap-6">
              <FormField label="カテゴリ名" required error={formErrors.name?.message}>
                <Input
                  placeholder="例: トレーニング"
                  maxLength={TEXT_MAX_LENGTH}
                  aria-invalid={!!formErrors.name}
                  {...form.register('name')}
                />
              </FormField>

              <FormField
                label="説明"
                description="カテゴリの用途や対象記事の説明を入力してください"
                error={formErrors.description?.message}
              >
                <Textarea
                  placeholder="例: 筋トレ・有酸素運動など一般的なトレーニング記事"
                  rows={3}
                  maxLength={TEXTAREA_MAX_LENGTH}
                  {...form.register('description')}
                />
              </FormField>

              <FormField
                label="種別"
                required
                description="このカテゴリを使用する記事の種別を選択してください"
                error={formErrors.type?.message}
              >
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      items={ARTICLE_CATEGORY_TYPE_LABELS}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-50" aria-invalid={!!formErrors.type}>
                        <SelectValue placeholder="種別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ArticleCategoryType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {ARTICLE_CATEGORY_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label="紐付けブランド"
                required
                description="このカテゴリを表示するブランドを選択してください"
                error={formErrors.brandEnum?.message}
              >
                <Controller
                  control={form.control}
                  name="brandEnum"
                  render={({ field }) => (
                    <Select
                      items={BRAND_LABELS}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-60" aria-invalid={!!formErrors.brandEnum}>
                        <SelectValue placeholder="ブランドを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BrandEnum).map((brandEnum) => (
                          <SelectItem key={brandEnum} value={brandEnum}>
                            {BRAND_LABELS[brandEnum]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label="表示順"
                description="小さい数値ほど上位に表示されます（1〜999）"
                error={formErrors.order?.message}
              >
                <Input
                  type="number"
                  min={1}
                  max={999}
                  className="w-30"
                  aria-invalid={!!formErrors.order}
                  {...form.register('order', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 公開設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">公開設定</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">公開状況</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  非公開にするとこのカテゴリは記事選択画面に表示されなくなります
                </p>
              </div>
              <Controller
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">非公開</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm font-medium">公開</span>
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={navigateToList}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <RoleGatedButton
            allowedRoles={[UserRole.Headquarter, UserRole.System]}
            denyTooltip="カテゴリの登録・編集は本部のみ可能です"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {mode === 'create' ? '登録する' : '変更を保存する'}
          </RoleGatedButton>
        </div>
      </div>
    </div>
  );
}
