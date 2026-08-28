'use client';

import { useRouter } from 'next/navigation';

import { ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { RoutineDetail, RoutineSet } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

function SetValueCell({ value, unit }: { value: number | null; unit: string }) {
  if (value === null) return <span className="text-muted-foreground">-</span>;
  return (
    <span>
      {value}
      {unit}
    </span>
  );
}

export function RoutineExerciseCompositionTab({ routine }: { routine: RoutineDetail }) {
  const router = useRouter();
  const totalSets = routine.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

  if (routine.exercises.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
        エクササイズが登録されていません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs">
        合計 {routine.exercises.length} 種目 / {totalSets} セット
      </p>

      {routine.exercises.map((exercise, index) => (
        <Card key={`${exercise.exerciseId}-${index}`} className="gap-0 py-0">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            <Button
              variant="link"
              className="text-primary h-auto p-0 text-sm font-medium underline-offset-2 hover:underline"
              onClick={() => router.push(navigate('/exercises/[id]', exercise.exerciseId))}
            >
              {exercise.exerciseName}
              <ExternalLink className="ml-1 size-3" />
            </Button>
            {exercise.categoryName && (
              <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                {exercise.categoryName}
              </Badge>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px] text-center text-xs font-semibold">セット</TableHead>
                <TableHead className="text-center text-xs font-semibold">Rep数</TableHead>
                <TableHead className="text-center text-xs font-semibold">推奨重量(kg)</TableHead>
                <TableHead className="text-center text-xs font-semibold">時間(秒)</TableHead>
                <TableHead className="text-center text-xs font-semibold">RPE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercise.sets.map((set: RoutineSet) => (
                <TableRow key={set.setNumber}>
                  <TableCell className="text-muted-foreground text-center text-xs font-medium">
                    {set.setNumber}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <SetValueCell value={set.targetReps} unit="回" />
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <SetValueCell value={set.targetWeightKg} unit="kg" />
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <SetValueCell value={set.targetDurationSeconds} unit="秒" />
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <SetValueCell value={set.targetRpe} unit="" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {exercise.hqComment && (
            <div className="bg-muted/20 border-t px-4 py-3">
              <p className="text-muted-foreground mb-1 text-xs font-medium">本部コメント</p>
              <p className="text-xs leading-relaxed">{exercise.hqComment}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
