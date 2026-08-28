'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { ALL_STORES, useCurrentStore } from '@/contexts/current-store.context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useImageUpload } from '@/hooks/use-image-upload.hook';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  getCrmExercisesByIdQueryKey,
  getCrmExercisesOptions,
  getCrmExercisesQueryKey,
  getCrmTrainingEquipmentOptions,
  patchCrmExercisesByIdMutation,
  postCrmExercisesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { useExerciseMasterOptions } from '../_hooks/use-exercise-master-options';
import { useExerciseUnsavedChanges } from '../_hooks/use-exercise-unsaved-changes';
import {
  type ExerciseDetail,
  type ExerciseFormInput,
  ExerciseFormSchema,
  type ExerciseFormValues,
  createExerciseFormDefaults,
  mapExerciseDetailToFormValues,
  mapExerciseFormValuesToBody,
} from '../_schemas/exercise-form.schema';
import { ExerciseFormBasicTab } from './exercise-form-basic-tab';
import { ExerciseFormRelatedTab } from './exercise-form-related-tab';
import { ExerciseFormStepsTab } from './exercise-form-steps-tab';

interface ExerciseFormProps {
  mode: 'create' | 'edit';
  defaultDetail?: ExerciseDetail;
}

export function ExerciseForm({ mode, defaultDetail }: ExerciseFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const defaultValues = useMemo(
    () =>
      defaultDetail ? mapExerciseDetailToFormValues(defaultDetail) : createExerciseFormDefaults(),
    [defaultDetail],
  );

  const form = useForm<ExerciseFormInput, unknown, ExerciseFormValues>({
    resolver: zodResolver(ExerciseFormSchema),
    defaultValues,
  });
  const publishStatus = useWatch({ control: form.control, name: 'publishStatus' });
  const toolId = useWatch({ control: form.control, name: 'toolId' });
  const linkedEquipmentIds = useWatch({
    control: form.control,
    name: 'linkedEquipmentIds',
    defaultValue: defaultValues.linkedEquipmentIds,
  });
  const explanationSteps = useWatch({
    control: form.control,
    name: 'explanationSteps',
    defaultValue: defaultValues.explanationSteps,
  });

  const relatedExercisesQuery = useQuery({
    ...getCrmExercisesOptions({ query: { limit: 200 } }),
  });
  const { categoryOptions, primaryMuscleOptions, toolOptions, typeOptions, bodyweightToolId } =
    useExerciseMasterOptions();
  const selectedToolCode = useMemo(
    () => toolOptions.find((item) => item.id === toolId)?.code ?? null,
    [toolId, toolOptions],
  );
  const selectedTrainingEquipmentMstToolId = useMemo(
    () => (toolId && selectedToolCode && selectedToolCode !== 'none' ? toolId : null),
    [selectedToolCode, toolId],
  );
  const isBodyweightToolSelected = Boolean(bodyweightToolId && toolId === bodyweightToolId);
  // The equipment list API makes `storeId` conditionally required (non-HQ roles get 400 if it is omitted).
  // Do not call it until the store scope is settled.
  const { currentStoreId, canSelectAllStores, isLoading: isStoreLoading } = useCurrentStore();
  const isAllStoresScope = canSelectAllStores && currentStoreId === ALL_STORES;
  const isStoreScopeReady = !isStoreLoading && (isAllStoresScope || currentStoreId !== ALL_STORES);
  const equipmentQuery = useQuery({
    ...getCrmTrainingEquipmentOptions({
      query: {
        page: 1,
        limit: 200,
        includeDiscarded: false,
        storeId: isAllStoresScope ? undefined : currentStoreId,
        mstToolId: selectedTrainingEquipmentMstToolId ?? undefined,
      },
    }),
    enabled: !isBodyweightToolSelected && isStoreScopeReady,
  });

  const relatedExerciseOptions =
    relatedExercisesQuery.data?.items.filter((item) => item.id !== defaultDetail?.id) ?? [];
  const equipmentOptions = useMemo(
    () =>
      (equipmentQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        label: item.name,
      })),
    [equipmentQuery.data?.items],
  );
  const selectedLinkedEquipmentIds = useMemo(() => linkedEquipmentIds ?? [], [linkedEquipmentIds]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [relatedExerciseSearch, setRelatedExerciseSearch] = useState('');
  const [pendingToolId, setPendingToolId] = useState<string | null>(null);
  const [equipmentClearOpen, setEquipmentClearOpen] = useState(false);
  const { uploadFiles, isUploading } = useImageUpload({ category: 'other' });

  async function handleImageFiles(files: File[]) {
    const currentImages = form.getValues('images');
    const remainingSlots = 5 - currentImages.length;
    if (remainingSlots <= 0) return;

    const uploaded = await uploadFiles(files.slice(0, remainingSlots));
    const nextImages = [
      ...currentImages,
      ...uploaded.map((url, index) => ({
        url,
        isPrimary: currentImages.length === 0 && index === 0,
      })),
    ];
    form.setValue('images', nextImages, { shouldDirty: true, shouldValidate: true });
  }

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  useEffect(() => {
    if (isBodyweightToolSelected && selectedLinkedEquipmentIds.length > 0) {
      form.setError('linkedEquipmentIds', {
        type: 'manual',
        message: '器具種別が「なし（自重）」の場合は機材を紐づけできません',
      });
      return;
    }

    form.clearErrors('linkedEquipmentIds');
  }, [form, isBodyweightToolSelected, selectedLinkedEquipmentIds]);

  const { confirmDiscard, discardDialogOpen, handleDiscardCancel, handleDiscardConfirm } =
    useExerciseUnsavedChanges(form.formState.isDirty);

  const createMutation = useMutation({
    ...postCrmExercisesMutation(),
    onSuccess: (response) => {
      toast.success('エクササイズを登録しました');
      void queryClient.invalidateQueries({ queryKey: getCrmExercisesQueryKey() });
      router.push(navigate('/exercises/[id]', response.exercise.id));
    },
    onError: () => {
      toast.error('処理に失敗しました');
    },
  });

  const updateMutation = useMutation({
    ...patchCrmExercisesByIdMutation(),
    onSuccess: (response, variables) => {
      toast.success('エクササイズを更新しました');
      void queryClient.invalidateQueries({ queryKey: getCrmExercisesQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: getCrmExercisesByIdQueryKey({ path: { id: variables.path.id } }),
      });
      router.push(navigate('/exercises/[id]', response.exercise.id));
    },
    onError: () => {
      toast.error('処理に失敗しました');
    },
  });

  const hasIncompleteSteps =
    publishStatus === 'public' && explanationSteps.some((step) => step.textJa.trim().length === 0);

  const handleToolChange = (value: string | null) => {
    if (!value) return;
    const currentToolId = form.getValues('toolId');
    if (value === bodyweightToolId && selectedLinkedEquipmentIds.length > 0) {
      setPendingToolId(value);
      setEquipmentClearOpen(true);
      return;
    }
    form.setValue('toolId', value, { shouldDirty: true, shouldValidate: true });
    if (value !== currentToolId && selectedLinkedEquipmentIds.length > 0) {
      form.setValue('linkedEquipmentIds', [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setEquipmentSearch('');
    }
  };

  const submit = form.handleSubmit((values) => {
    if (
      bodyweightToolId &&
      values.toolId === bodyweightToolId &&
      values.linkedEquipmentIds.length > 0
    ) {
      form.setError('linkedEquipmentIds', {
        type: 'manual',
        message: '器具種別が「なし（自重）」の場合は機材を紐づけできません',
      });
      return;
    }

    const body = mapExerciseFormValuesToBody(values);
    if (isEdit && defaultDetail) {
      updateMutation.mutate({
        path: { id: defaultDetail.id },
        body,
      });
      return;
    }
    createMutation.mutate({ body });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-6 p-6">
        {publishStatus === 'public' && hasIncompleteSteps ? (
          <Alert className="border-warning/50 bg-warning/15">
            <AlertTriangle className="text-warning size-4" />
            <AlertDescription className="text-xs">
              解説ステップが未入力です。公開は可能ですが、未入力ステップは警告状態のままになります。
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="basic" className="gap-4">
          <TabsList variant="line">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="steps">解説ステップ</TabsTrigger>
            <TabsTrigger value="related">関連情報</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <ExerciseFormBasicTab
              categoryOptions={categoryOptions}
              imageInputRef={imageInputRef}
              isUploading={isUploading}
              onHandleImageFiles={handleImageFiles}
              onToolChange={handleToolChange}
              primaryMuscleOptions={primaryMuscleOptions}
              toolOptions={toolOptions}
              typeOptions={typeOptions}
            />
          </TabsContent>

          <TabsContent value="steps">
            <ExerciseFormStepsTab hasIncompleteSteps={hasIncompleteSteps} />
          </TabsContent>

          <TabsContent value="related">
            <ExerciseFormRelatedTab
              currentExerciseId={defaultDetail?.id}
              equipmentOptions={equipmentOptions}
              equipmentSearch={equipmentSearch}
              isBodyweightToolSelected={isBodyweightToolSelected}
              isEquipmentError={equipmentQuery.isError}
              isEquipmentLoading={equipmentQuery.isLoading}
              onEquipmentSearchChange={setEquipmentSearch}
              onRelatedExerciseSearchChange={setRelatedExerciseSearch}
              relatedExerciseOptions={relatedExerciseOptions}
              relatedExerciseSearch={relatedExerciseSearch}
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              confirmDiscard(() =>
                router.push(
                  isEdit && defaultDetail
                    ? navigate('/exercises/[id]', defaultDetail.id)
                    : navigate('/exercises'),
                ),
              )
            }
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? '変更を保存する' : '登録する'}
          </Button>
        </div>

        <AlertDialog open={discardDialogOpen} onOpenChange={handleDiscardCancel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>編集内容を破棄しますか？</AlertDialogTitle>
              <AlertDialogDescription>保存していない変更は失われます。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDiscardCancel}>編集を続ける</AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscardConfirm}>破棄する</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={equipmentClearOpen} onOpenChange={setEquipmentClearOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>紐づけ機材を解除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                器具種別を「なし（自重）」に変更すると、紐づけ済み機材は解除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setPendingToolId(null);
                  setEquipmentClearOpen(false);
                }}
              >
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  form.setValue('toolId', pendingToolId ?? bodyweightToolId ?? '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue('linkedEquipmentIds', [], {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setPendingToolId(null);
                  setEquipmentClearOpen(false);
                }}
              >
                解除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}
