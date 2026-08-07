'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { type SurveyFormValues, createEmptySurveyQuestion } from '../_schemas/survey-form.schema';
import { SurveyQuestionRow } from './survey-form-question-row';

interface SurveyFormQuestionsSectionProps {
  onDeleteQuestion: (index: number) => void;
}

export function SurveyFormQuestionsSection({
  onDeleteQuestion,
}: Readonly<SurveyFormQuestionsSectionProps>) {
  const form = useFormContext<SurveyFormValues>();
  const { fields, append, move } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const handleAddQuestion = () => {
    append(createEmptySurveyQuestion(`q-${crypto.randomUUID()}`));
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="text-base">設問設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-xs font-semibold">表示順</TableHead>
              <TableHead className="text-xs font-semibold">設問内容</TableHead>
              <TableHead className="w-48 text-xs font-semibold">回答形式</TableHead>
              <TableHead className="w-20 text-xs font-semibold">任意/必答</TableHead>
              <TableHead className="w-28 text-xs font-semibold">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <SurveyQuestionRow
                key={field.id}
                index={index}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => move(index, index - 1)}
                onMoveDown={() => move(index, index + 1)}
                onDelete={() => onDeleteQuestion(index)}
              />
            ))}
          </TableBody>
        </Table>

        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion}>
            <Plus className="size-4" />
            設問を追加
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
