'use client';

import { Suspense, useMemo, useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { Loading } from '@/components/common/data-state-boundary/loading';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  deleteCrmExerciseCategoriesByIdMutation,
  deleteCrmExerciseMusclesByIdMutation,
  deleteCrmExerciseToolTypesByIdMutation,
  deleteCrmExerciseTypesByIdMutation,
  getCrmExerciseCategoriesOptions,
  getCrmExerciseCategoriesQueryKey,
  getCrmExerciseMusclesOptions,
  getCrmExerciseMusclesQueryKey,
  getCrmExerciseToolTypesOptions,
  getCrmExerciseToolTypesQueryKey,
  getCrmExerciseTypesOptions,
  getCrmExerciseTypesQueryKey,
  patchCrmExerciseCategoriesByIdMutation,
  patchCrmExerciseMusclesByIdMutation,
  patchCrmExerciseToolTypesByIdMutation,
  patchCrmExerciseTypesByIdMutation,
  postCrmExerciseCategoriesMutation,
  postCrmExerciseMusclesMutation,
  postCrmExerciseToolTypesMutation,
  postCrmExerciseTypesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { ExerciseMasterListItem } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

import { ExerciseMasterDeleteDialog } from './_components/exercise-master-delete-dialog';
import { ExerciseMasterFormDialog } from './_components/exercise-master-form-dialog';
import { ExerciseMasterTable } from './_components/exercise-master-table';
import {
  type FormMode,
  TAB_META,
  TAB_ORDER,
  type TabKey,
  getNextSortOrder,
} from './_constants/constants';
import {
  EMPTY_EXERCISE_MASTER_FORM_VALUES,
  type ExerciseMasterFormSubmitValues,
  type ExerciseMasterFormValues,
} from './_schemas/exercise-master-form.schema';

const GENERIC_API_ERROR_MESSAGE = '処理に失敗しました';

function ExerciseMasterPageContent() {
  const { hasRole, isLoading: isAuthLoading } = useAuthUser();
  const queryClient = useQueryClient();
  const canAccess = hasRole([UserRole.System, UserRole.Headquarter]);
  const [activeTab, setActiveTab] = useState<TabKey>('category');
  const [searchValues, setSearchValues] = useState<Record<TabKey, string>>({
    category: '',
    muscle: '',
    tool: '',
    exercise_type: '',
  });
  const [formState, setFormState] = useState<{
    open: boolean;
    mode: FormMode;
    kind: TabKey;
    row: ExerciseMasterListItem | null;
  }>({
    open: false,
    mode: 'create',
    kind: 'category',
    row: null,
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    kind: TabKey;
    row: ExerciseMasterListItem | null;
  }>({
    open: false,
    kind: 'category',
    row: null,
  });

  const categoryQuery = useQuery({
    ...getCrmExerciseCategoriesOptions({
      query: searchValues.category.trim() ? { search: searchValues.category.trim() } : undefined,
    }),
    enabled: canAccess,
  });
  const muscleQuery = useQuery({
    ...getCrmExerciseMusclesOptions({
      query: searchValues.muscle.trim() ? { search: searchValues.muscle.trim() } : undefined,
    }),
    enabled: canAccess,
  });
  const toolQuery = useQuery({
    ...getCrmExerciseToolTypesOptions({
      query: searchValues.tool.trim() ? { search: searchValues.tool.trim() } : undefined,
    }),
    enabled: canAccess,
  });
  const exerciseTypeQuery = useQuery({
    ...getCrmExerciseTypesOptions({
      query: searchValues.exercise_type.trim()
        ? { search: searchValues.exercise_type.trim() }
        : undefined,
    }),
    enabled: canAccess,
  });

  const queries = {
    category: categoryQuery,
    muscle: muscleQuery,
    tool: toolQuery,
    exercise_type: exerciseTypeQuery,
  };

  const activeQuery = queries[activeTab];
  const activeItems = activeQuery.data?.items ?? [];
  const activeLabel = TAB_META[activeTab].label;
  const activeCount = activeItems.length;
  const nextSortOrder = getNextSortOrder(activeItems);

  const createCategoryMutation = useMutation({
    ...postCrmExerciseCategoriesMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseCategoriesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const createMuscleMutation = useMutation({
    ...postCrmExerciseMusclesMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseMusclesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const createToolMutation = useMutation({
    ...postCrmExerciseToolTypesMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseToolTypesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const createExerciseTypeMutation = useMutation({
    ...postCrmExerciseTypesMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseTypesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const updateCategoryMutation = useMutation({
    ...patchCrmExerciseCategoriesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseCategoriesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const updateMuscleMutation = useMutation({
    ...patchCrmExerciseMusclesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseMusclesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const updateToolMutation = useMutation({
    ...patchCrmExerciseToolTypesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseToolTypesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const updateExerciseTypeMutation = useMutation({
    ...patchCrmExerciseTypesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message);
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseTypesQueryKey(),
      });
      setFormState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const deleteCategoryMutation = useMutation({
    ...deleteCrmExerciseCategoriesByIdMutation(),
    onSuccess: () => {
      toast.success('参照マスタを削除しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseCategoriesQueryKey(),
      });
      setDeleteState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const deleteMuscleMutation = useMutation({
    ...deleteCrmExerciseMusclesByIdMutation(),
    onSuccess: () => {
      toast.success('参照マスタを削除しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseMusclesQueryKey(),
      });
      setDeleteState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const deleteToolMutation = useMutation({
    ...deleteCrmExerciseToolTypesByIdMutation(),
    onSuccess: () => {
      toast.success('参照マスタを削除しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseToolTypesQueryKey(),
      });
      setDeleteState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const deleteExerciseTypeMutation = useMutation({
    ...deleteCrmExerciseTypesByIdMutation(),
    onSuccess: () => {
      toast.success('参照マスタを削除しました');
      void queryClient.invalidateQueries({
        queryKey: getCrmExerciseTypesQueryKey(),
      });
      setDeleteState((current) => ({ ...current, open: false, row: null }));
    },
    onError: () => {
      toast.error(GENERIC_API_ERROR_MESSAGE);
    },
  });

  const initialValues = useMemo<ExerciseMasterFormValues>(() => {
    if (formState.mode === 'edit' && formState.row) {
      return {
        code: formState.row.code,
        name: formState.row.name,
        description: formState.row.description ?? '',
        sortOrder: String(formState.row.sortOrder),
      };
    }

    return {
      ...EMPTY_EXERCISE_MASTER_FORM_VALUES,
      sortOrder: nextSortOrder,
    };
  }, [formState.mode, formState.row, nextSortOrder]);

  const handleSave = (values: ExerciseMasterFormSubmitValues) => {
    const sortOrder = Number(values.sortOrder);

    if (formState.mode === 'create') {
      const body = {
        code: values.code,
        name: values.name,
        description: values.description.length > 0 ? values.description : null,
        sortOrder,
      };

      if (formState.kind === 'category') createCategoryMutation.mutate({ body });
      if (formState.kind === 'muscle') createMuscleMutation.mutate({ body });
      if (formState.kind === 'tool') createToolMutation.mutate({ body });
      if (formState.kind === 'exercise_type') createExerciseTypeMutation.mutate({ body });
      return;
    }

    if (!formState.row) {
      toast.error('入力内容を確認してください');
      return;
    }

    const body = {
      name: values.name,
      description: values.description.length > 0 ? values.description : null,
      sortOrder,
    };

    if (formState.kind === 'category') {
      updateCategoryMutation.mutate({ path: { id: formState.row.id }, body });
    }
    if (formState.kind === 'muscle') {
      updateMuscleMutation.mutate({ path: { id: formState.row.id }, body });
    }
    if (formState.kind === 'tool') {
      updateToolMutation.mutate({ path: { id: formState.row.id }, body });
    }
    if (formState.kind === 'exercise_type') {
      updateExerciseTypeMutation.mutate({ path: { id: formState.row.id }, body });
    }
  };

  if (isAuthLoading) {
    return <Loading />;
  }

  if (!canAccess) {
    return (
      <>
        <PageHeader
          breadcrumb={<BackLink label="エクササイズ管理に戻る" href={navigate('/exercises')} />}
          title="参照マスタ管理"
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">
            参照マスタ管理は本部（Headquarter / System）のみアクセスできます
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="エクササイズ管理に戻る" href={navigate('/exercises')} />}
        title="参照マスタ管理"
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Database className="size-3.5" />
              {activeCount}件
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 rounded-full px-2.5 text-[11px] font-medium"
                    />
                  }
                >
                  本部
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="max-w-xs">
                  <p className="text-xs leading-5">
                    参照マスタ管理は本部（Headquarter / System）のみ操作できます
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
        actions={
          <RoleGatedButton
            allowedRoles={[UserRole.System, UserRole.Headquarter]}
            denyTooltip="参照マスタ管理は本部のみ操作できます"
            type="button"
            className="gap-1 bg-black text-white hover:bg-black/90"
            onClick={() => {
              setFormState({
                open: true,
                mode: 'create',
                kind: activeTab,
                row: null,
              });
            }}
          >
            <Plus className="size-4" />
            {activeLabel}を登録
          </RoleGatedButton>
        }
      />

      <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
          <TabsList variant="line">
            {TAB_ORDER.map((kind) => (
              <TabsTrigger key={kind} value={kind} className="text-sm">
                {TAB_META[kind].label}
                <Badge variant="outline" className="ml-1 min-w-5 px-1 tabular-nums">
                  {queries[kind].data?.items.length ?? 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_ORDER.map((kind) => (
            <TabsContent key={kind} value={kind} className="mt-3">
              <ExerciseMasterTable
                label={TAB_META[kind].label}
                items={queries[kind].data?.items ?? []}
                searchValue={searchValues[kind]}
                onSearchChange={(value) =>
                  setSearchValues((current) => ({
                    ...current,
                    [kind]: value,
                  }))
                }
                onCreate={() => {
                  setActiveTab(kind);
                  setFormState({
                    open: true,
                    mode: 'create',
                    kind,
                    row: null,
                  });
                }}
                onEdit={(row) => {
                  setActiveTab(kind);
                  setFormState({
                    open: true,
                    mode: 'edit',
                    kind,
                    row,
                  });
                }}
                onDelete={(row) => {
                  setActiveTab(kind);
                  setDeleteState({
                    open: true,
                    kind,
                    row,
                  });
                }}
                isLoading={queries[kind].isLoading}
                isError={queries[kind].isError}
                onRetry={() => {
                  void queries[kind].refetch();
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <ExerciseMasterFormDialog
        key={`${formState.mode}-${formState.kind}-${formState.row?.id ?? 'new'}-${formState.open ? 'open' : 'closed'}`}
        open={formState.open}
        mode={formState.mode}
        label={TAB_META[formState.kind].label}
        isSubmitting={
          createCategoryMutation.isPending ||
          createMuscleMutation.isPending ||
          createToolMutation.isPending ||
          createExerciseTypeMutation.isPending ||
          updateCategoryMutation.isPending ||
          updateMuscleMutation.isPending ||
          updateToolMutation.isPending ||
          updateExerciseTypeMutation.isPending
        }
        initialValues={initialValues}
        onOpenChange={(open) => {
          if (!open) {
            setFormState({
              open: false,
              mode: 'create',
              kind: activeTab,
              row: null,
            });
          }
        }}
        onSubmit={handleSave}
      />

      <ExerciseMasterDeleteDialog
        open={deleteState.open}
        label={TAB_META[deleteState.kind].label}
        row={deleteState.row}
        isSubmitting={
          deleteCategoryMutation.isPending ||
          deleteMuscleMutation.isPending ||
          deleteToolMutation.isPending ||
          deleteExerciseTypeMutation.isPending
        }
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({
              open: false,
              kind: activeTab,
              row: null,
            });
          }
        }}
        onConfirm={() => {
          if (!deleteState.row) return;
          if (deleteState.kind === 'category') {
            deleteCategoryMutation.mutate({ path: { id: deleteState.row.id } });
          }
          if (deleteState.kind === 'muscle') {
            deleteMuscleMutation.mutate({ path: { id: deleteState.row.id } });
          }
          if (deleteState.kind === 'tool') {
            deleteToolMutation.mutate({ path: { id: deleteState.row.id } });
          }
          if (deleteState.kind === 'exercise_type') {
            deleteExerciseTypeMutation.mutate({ path: { id: deleteState.row.id } });
          }
        }}
      />
    </>
  );
}

export default function ExerciseMasterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExerciseMasterPageContent />
    </Suspense>
  );
}
