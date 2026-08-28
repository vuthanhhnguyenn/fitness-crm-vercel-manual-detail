'use client';

import { useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Info, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  deleteCrmLessonSchedulesTemplatesByIdMutation,
  getCrmLessonSchedulesTemplatesOptions,
  getCrmLessonSchedulesTemplatesQueryKey,
  postCrmLessonSchedulesTemplatesMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmLessonSchedulesTemplatesResponse,
  PostCrmLessonSchedulesTemplatesData,
} from '@/lib/api/types.gen';

import {
  DAY_OF_WEEK_LABELS,
  END_CONDITION_LABELS,
  REPEAT_TYPE_LABELS,
} from '../_constants/constants';
import type { LessonScheduleFormValues } from '../_schemas/lesson-schedule-form.schema';
import {
  type LessonScheduleTemplateSaveValues,
  lessonScheduleTemplateSaveSchema,
} from '../_schemas/lesson-schedule-template.schema';

type LessonScheduleTemplate = GetCrmLessonSchedulesTemplatesResponse['templates'][number];

const templatesQueryKey = getCrmLessonSchedulesTemplatesQueryKey();

function hasTemplateSavableValues(values: {
  repeat_type?: LessonScheduleFormValues['repeat_type'];
  days_of_week?: LessonScheduleFormValues['days_of_week'];
  start_time?: LessonScheduleFormValues['start_time'];
  end_condition?: LessonScheduleFormValues['end_condition'];
  skip_holidays?: LessonScheduleFormValues['skip_holidays'];
}): boolean {
  return Boolean(
    values.repeat_type ||
    (values.days_of_week ?? []).length > 0 ||
    values.start_time ||
    values.end_condition ||
    values.skip_holidays,
  );
}

function buildCreateTemplateBody(
  name: string,
  values: LessonScheduleFormValues,
): NonNullable<PostCrmLessonSchedulesTemplatesData['body']> {
  const endCondition = values.end_condition ?? 'indefinite';

  return {
    name,
    repeat_type: values.repeat_type ?? 'weekly',
    days_of_week: values.days_of_week ?? [],
    end_condition: endCondition,
    end_value:
      endCondition === 'by_date'
        ? (values.end_date ?? '')
        : endCondition === 'by_count'
          ? (values.end_count ?? 12)
          : null,
    skip_holidays: values.skip_holidays ?? false,
    start_time: values.start_time,
    store_id: values.store_id,
    lesson_class: values.lesson_type,
    studio_id: values.studio_id || null,
    lesson_id: values.lesson_id,
  };
}

export function LessonScheduleTemplatePopover() {
  const form = useFormContext<LessonScheduleFormValues>();
  const queryClient = useQueryClient();

  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<'new' | 'overwrite'>('new');

  const saveForm = useForm<LessonScheduleTemplateSaveValues>({
    resolver: zodResolver(lessonScheduleTemplateSaveSchema),
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const [repeatType, daysOfWeek, startTime, endCondition, endDate, endCount, skipHolidays] =
    useWatch({
      control: form.control,
      name: [
        'repeat_type',
        'days_of_week',
        'start_time',
        'end_condition',
        'end_date',
        'end_count',
        'skip_holidays',
      ],
    });

  const canSaveCurrentSettings = hasTemplateSavableValues({
    repeat_type: repeatType,
    days_of_week: daysOfWeek,
    start_time: startTime,
    end_condition: endCondition,
    skip_holidays: skipHolidays,
  });

  const { data: templatesRes, isLoading } = useQuery({
    ...getCrmLessonSchedulesTemplatesOptions(),
  });
  const templates = templatesRes?.templates ?? [];

  const saveMutation = useMutation({
    ...postCrmLessonSchedulesTemplatesMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
    },
  });

  const deleteMutation = useMutation({
    ...deleteCrmLessonSchedulesTemplatesByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesQueryKey });
    },
  });

  function handleLoadTemplate(tpl: LessonScheduleTemplate) {
    setLoadedTemplateId(tpl.id);
    form.setValue('repeat_type', tpl.repeat_type, { shouldDirty: true });
    form.setValue('end_condition', tpl.end_condition, { shouldDirty: true });
    form.setValue('days_of_week', tpl.days_of_week, { shouldDirty: true });
    form.setValue('skip_holidays', tpl.skip_holidays, { shouldDirty: true });
    if (tpl.end_condition === 'by_date' && typeof tpl.end_value === 'string') {
      form.setValue('end_date', tpl.end_value);
    } else if (tpl.end_condition === 'by_count' && typeof tpl.end_value === 'number') {
      form.setValue('end_count', tpl.end_value);
    }
    form.setValue('start_time', tpl.start_time);
    form.setValue('store_id', tpl.store_id);
    form.setValue('lesson_type', tpl.lesson_class);
    if (tpl.studio_id) form.setValue('studio_id', tpl.studio_id);
    form.setValue('lesson_id', tpl.lesson_id);
    setPopoverOpen(false);
  }

  async function handleSaveTemplate(values: LessonScheduleTemplateSaveValues) {
    const body = buildCreateTemplateBody(values.name.trim(), form.getValues());

    try {
      if (saveMode === 'overwrite' && loadedTemplateId) {
        await deleteMutation.mutateAsync({ path: { id: loadedTemplateId } });
      }

      const result = await saveMutation.mutateAsync({ body });
      setLoadedTemplateId(result.id);
      toast.success('テンプレートを保存しました');
      setSaveDialogOpen(false);
      saveForm.reset({ name: '' });
    } catch {
      toast.error('テンプレートの保存に失敗しました');
    }
  }

  function handleDeleteTemplate(id: string) {
    deleteMutation.mutate(
      { path: { id } },
      {
        onSuccess: () => {
          toast.success('テンプレートを削除しました');
          if (loadedTemplateId === id) setLoadedTemplateId(null);
        },
        onError: () => {
          toast.error('テンプレートの削除に失敗しました');
        },
      },
    );
  }

  function handleOpenSaveDialog() {
    const loaded = loadedTemplateId ? templates.find((t) => t.id === loadedTemplateId) : null;
    setSaveMode(loaded ? 'overwrite' : 'new');
    saveForm.reset({ name: loaded?.name ?? '' });
    setSaveDialogOpen(true);
    setPopoverOpen(false);
  }

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={<Button type="button" variant="outline" className="h-8 shrink-0 gap-2 px-3" />}
        >
          <Bookmark className="size-4" />
          テンプレート
          {templates.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 flex h-4 min-w-5 items-center justify-center px-1 text-[10px]"
            >
              {templates.length}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">保存済みパターン</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="text-muted-foreground flex items-center justify-center px-4 py-6 text-xs">
                <Loader2 className="mr-2 size-4 animate-spin" />
                読み込み中...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center px-4 py-6 text-xs">
                <Info className="mr-2 size-4" />
                保存済みパターンはありません
              </div>
            ) : (
              <div className="divide-y">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="hover:bg-muted/40 flex items-center gap-2 px-4 py-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Bookmark className="text-muted-foreground size-3 shrink-0" />
                        <p className="truncate text-sm font-medium">{tpl.name}</p>
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {REPEAT_TYPE_LABELS[tpl.repeat_type]}
                        {tpl.days_of_week.length > 0 &&
                          ` · ${tpl.days_of_week.map((d) => DAY_OF_WEEK_LABELS[d]).join('')}`}
                        {tpl.start_time && ` · ${tpl.start_time}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 text-xs"
                      onClick={() => handleLoadTemplate(tpl)}
                    >
                      読込
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="size-7 shrink-0 p-0"
                            disabled={deleteMutation.isPending}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t p-3">
            {canSaveCurrentSettings ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={handleOpenSaveDialog}
              >
                + 現在の設定を保存
              </Button>
            ) : (
              <TooltipProvider delay={0}>
                <Tooltip>
                  <TooltipTrigger render={<span className="flex w-full" />}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="pointer-events-none h-8 w-full text-xs opacity-50"
                      disabled
                      aria-disabled
                    >
                      + 現在の設定を保存
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">設定値が入力されていません</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <Form {...saveForm}>
            <form onSubmit={saveForm.handleSubmit(handleSaveTemplate)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>繰り返しパターンを保存</DialogTitle>
                <DialogDescription>
                  現在の繰り返し設定をテンプレートとして保存します。次回以降の登録で呼び出して再利用できます
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {loadedTemplateId && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block text-xs font-medium">
                      保存モード
                    </Label>
                    <RadioGroup
                      value={saveMode}
                      onValueChange={(v) => setSaveMode(v as 'new' | 'overwrite')}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="overwrite" id="save-overwrite" />
                        <Label htmlFor="save-overwrite" className="cursor-pointer text-sm">
                          「{templates.find((t) => t.id === loadedTemplateId)?.name}」を上書き保存
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="new" id="save-new" />
                        <Label htmlFor="save-new" className="cursor-pointer text-sm">
                          新しいテンプレートとして保存
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                <FormField
                  control={saveForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        テンプレート名 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          placeholder="例: 平日朝クラス"
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="border-border/50 bg-muted/50 space-y-1.5 rounded-md border px-3 py-2">
                  <p className="text-xs font-semibold">保存される内容</p>
                  <p className="text-muted-foreground text-xs">
                    繰り返しタイプ: {REPEAT_TYPE_LABELS[repeatType ?? 'weekly']}
                    {(daysOfWeek ?? []).length > 0 &&
                      `（${(daysOfWeek ?? []).map((d) => DAY_OF_WEEK_LABELS[d]).join('')}）`}{' '}
                    / 開始時刻: {startTime || '未設定'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    終了条件: {END_CONDITION_LABELS[endCondition ?? 'by_date']}
                    {endCondition === 'by_date' && endDate && `（${endDate}まで）`}
                    {endCondition === 'by_count' && Boolean(endCount) && `（${endCount}回）`} /
                    祝日スキップ設定: {skipHolidays ? '含む（ON）' : '含む（OFF）'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    ※ 日付・インストラクターは個別に入力してください
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaveDialogOpen(false)}
                  disabled={isSaving}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={!saveForm.formState.isValid || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      保存中...
                    </>
                  ) : loadedTemplateId && saveMode === 'overwrite' ? (
                    '上書き保存'
                  ) : (
                    '保存'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
