'use client';

import { useEffect } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { SURVEY_QUESTION_FORMAT_LABELS } from '../_constants/constants';
import {
  SURVEY_QUESTION_FORMAT_VALUES,
  type SurveyFormValues,
} from '../_schemas/survey-form.schema';

interface SurveyQuestionRowProps {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function makeChoiceId(questionId: string) {
  return `${questionId}-choice-${crypto.randomUUID()}`;
}

export function SurveyQuestionRow({
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Readonly<SurveyQuestionRowProps>) {
  const form = useFormContext<SurveyFormValues>();
  const question = useWatch({ control: form.control, name: `questions.${index}` });

  const {
    fields: choiceFields,
    append: appendChoice,
    remove: removeChoice,
    move: moveChoice,
    replace: replaceChoices,
  } = useFieldArray({
    control: form.control,
    name: `questions.${index}.choices` as const,
  });

  const format = question?.format;
  useEffect(() => {
    if (!format) return;

    if (format === 'free_text' && choiceFields.length > 0) {
      replaceChoices([]);
      return;
    }

    if (format !== 'free_text' && choiceFields.length === 0) {
      appendChoice({ id: makeChoiceId(question?.id ?? `q-${index}`), text: '' });
    }
  }, [appendChoice, choiceFields.length, format, index, question?.id, replaceChoices]);

  const isChoice = format === 'single_choice' || format === 'multiple_choice';

  return (
    <>
      <TableRow>
        <TableCell className="text-muted-foreground align-top text-xs">{index + 1}</TableCell>
        <TableCell className="align-top">
          <Input
            placeholder="設問内容を入力"
            {...form.register(`questions.${index}.content` as const)}
          />
        </TableCell>
        <TableCell className="align-top">
          <Select
            value={format}
            onValueChange={(value) =>
              form.setValue(
                `questions.${index}.format`,
                value as SurveyFormValues['questions'][number]['format'],
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger>
              <SelectValue>{format ? SURVEY_QUESTION_FORMAT_LABELS[format] : '選択'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SURVEY_QUESTION_FORMAT_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {SURVEY_QUESTION_FORMAT_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="align-top">
          <div className="flex items-center gap-2">
            <Switch
              checked={question?.required ?? false}
              onCheckedChange={(checked) =>
                form.setValue(`questions.${index}.required`, checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <span
              className={`text-xs ${question?.required ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
            >
              {question?.required ? '必答' : '任意'}
            </span>
          </div>
        </TableCell>
        <TableCell className="align-top">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={isFirst}
              onClick={onMoveUp}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={isLast}
              onClick={onMoveDown}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive size-8"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isChoice && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="pt-0 pb-3">
            <div className="bg-muted/30 ml-6 overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-xs font-semibold">順番</TableHead>
                    <TableHead className="text-xs font-semibold">選択肢テキスト</TableHead>
                    <TableHead className="w-28 text-xs font-semibold">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {choiceFields.map((choice, choiceIndex) => (
                    <TableRow key={choice.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {choiceIndex + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="選択肢テキストを入力"
                          className="h-8 text-sm"
                          {...form.register(
                            `questions.${index}.choices.${choiceIndex}.text` as const,
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={choiceIndex === 0}
                            onClick={() => moveChoice(choiceIndex, choiceIndex - 1)}
                          >
                            <ArrowUp className="size-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            disabled={choiceIndex === choiceFields.length - 1}
                            onClick={() => moveChoice(choiceIndex, choiceIndex + 1)}
                          >
                            <ArrowDown className="size-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive size-7"
                            onClick={() => removeChoice(choiceIndex)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t px-3 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() =>
                    appendChoice({
                      id: makeChoiceId(question?.id ?? `q-${index}`),
                      text: '',
                    })
                  }
                >
                  <Plus className="size-3" />
                  選択肢を追加
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
