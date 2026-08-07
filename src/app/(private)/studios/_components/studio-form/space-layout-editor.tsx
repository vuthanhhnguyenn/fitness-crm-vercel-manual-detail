'use client';

import { useCallback, useMemo, useState } from 'react';
import { type FieldError, useFormContext } from 'react-hook-form';

import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';

import type { LayoutCell, SpaceLayout, StudioFormValues } from '../studio-form.schema';

const PLACEMENT_BUTTONS: Array<{
  mode: LayoutCell['kind'];
  label: string;
  active: string;
  idle: string;
}> = [
  {
    mode: 'normal_seat',
    label: '通常席',
    active: 'bg-success/15 text-success border-success/40 ring-2 ring-success/30',
    idle: 'bg-success/10 text-success border-success/20 hover:bg-success/15',
  },
  {
    mode: 'equipment_seat',
    label: '器材席',
    active: 'bg-warning/15 text-warning border-warning/40 ring-2 ring-warning/30',
    idle: 'bg-warning/5 text-warning border-warning/20 hover:bg-warning/10',
  },
  {
    mode: 'fixed_object',
    label: '固定物',
    active: 'bg-foreground/15 text-muted-foreground border-foreground/40 ring-2 ring-foreground/20',
    idle: 'bg-foreground/5 text-muted-foreground border-foreground/20 hover:bg-foreground/10',
  },
  {
    mode: 'empty',
    label: '未使用',
    active: 'bg-accent text-foreground border-foreground/40 ring-2 ring-foreground/20',
    idle: '',
  },
];

const CELL_STYLES: Record<LayoutCell['kind'], string> = {
  normal_seat:
    'size-10 rounded flex items-center justify-center text-xs font-medium border cursor-pointer transition-colors bg-success/10 text-success border-success/20 hover:bg-success/20',
  equipment_seat:
    'size-10 rounded flex items-center justify-center text-xs font-medium border cursor-pointer transition-colors bg-warning/15 text-warning border-warning/20 hover:bg-warning/25',
  fixed_object:
    'size-10 rounded flex items-center justify-center text-xs font-medium border cursor-pointer transition-colors bg-muted text-muted-foreground border-border hover:bg-muted/70',
  empty:
    'size-10 rounded flex items-center justify-center text-xs font-medium border cursor-pointer transition-colors bg-background text-muted-foreground hover:bg-accent border-dashed',
};

const COLUMN_OPTIONS = [6, 8, 10] as const;
const ROW_OPTIONS = [2, 3, 4, 5] as const;

const DEFAULT_ROWS = 2;
const DEFAULT_COLUMNS = 8;

function createEmptyCells(rows: number, columns: number): LayoutCell[] {
  const cells: LayoutCell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      cells.push({ x, y, kind: 'empty' });
    }
  }
  return cells;
}

function preserveCellsWithinBounds(
  cells: LayoutCell[],
  rows: number,
  columns: number,
): LayoutCell[] {
  return cells.filter((c) => c.x < columns && c.y < rows);
}

function getLayoutErrorMessages(error: FieldError | undefined): string[] {
  if (!error) return [];

  const messages: string[] = [];
  if (error.message) {
    messages.push(String(error.message));
  }

  for (const key of ['rows', 'columns', 'cells'] as const) {
    const nested = (error as unknown as Record<string, FieldError | undefined>)[key];
    if (nested?.message) {
      messages.push(String(nested.message));
    }
  }

  return [...new Set(messages)];
}

function LayoutFormMessage({ error }: { error?: FieldError }) {
  const messages = getLayoutErrorMessages(error);
  if (messages.length === 0) return null;

  if (messages.length === 1) {
    return <p className="text-destructive mb-2 text-xs">{messages[0]}</p>;
  }

  return (
    <ul className="text-destructive mb-2 list-disc space-y-1 pl-4 text-xs">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

interface SpaceLayoutEditorContentProps {
  value?: Partial<SpaceLayout> | SpaceLayout;
  onChange: (layout: SpaceLayout) => void;
  error?: FieldError;
}

function SpaceLayoutEditorContent({ value, onChange, error }: SpaceLayoutEditorContentProps) {
  const rows = value?.rows ?? DEFAULT_ROWS;
  const columns = value?.columns ?? DEFAULT_COLUMNS;
  const cells = value?.cells ?? createEmptyCells(DEFAULT_ROWS, DEFAULT_COLUMNS);
  const [selectedMode, setSelectedMode] = useState<LayoutCell['kind']>('normal_seat');

  const gridCells = useMemo(() => {
    const cellMap = new Map<string, LayoutCell>();
    for (const cell of cells) {
      cellMap.set(`${cell.x},${cell.y}`, cell);
    }
    const result: LayoutCell[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const key = `${x},${y}`;
        result.push(cellMap.get(key) ?? { x, y, kind: 'empty' });
      }
    }
    return result;
  }, [cells, rows, columns]);

  const typeCounts = useMemo(() => {
    const counts = { available: 0, equipment: 0, pillar: 0, empty: 0 };
    for (const cell of cells) {
      if (cell.kind === 'normal_seat') counts.available++;
      else if (cell.kind === 'equipment_seat') counts.equipment++;
      else if (cell.kind === 'fixed_object') counts.pillar++;
      else counts.empty++;
    }
    return counts;
  }, [cells]);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      const newCells = gridCells.map((cell) =>
        cell.x === x && cell.y === y ? { ...cell, kind: selectedMode } : cell,
      );
      onChange({ rows, columns, cells: newCells });
    },
    [gridCells, rows, columns, selectedMode, onChange],
  );

  const handleRowsChange = useCallback(
    (newRows: string | null) => {
      if (!newRows) return;
      const r = Number(newRows);
      const preserved = preserveCellsWithinBounds(cells, r, columns);
      onChange({ rows: r, columns, cells: preserved });
    },
    [cells, columns, onChange],
  );

  const handleColumnsChange = useCallback(
    (newColumns: string | null) => {
      if (!newColumns) return;
      const c = Number(newColumns);
      const preserved = preserveCellsWithinBounds(cells, rows, c);
      onChange({ rows, columns: c, cells: preserved });
    },
    [cells, rows, onChange],
  );

  const handleReset = useCallback(() => {
    onChange({ rows: DEFAULT_ROWS, columns: DEFAULT_COLUMNS, cells: [] });
  }, [onChange]);

  return (
    <Card className="sticky top-0 pb-0">
      <CardContent className="px-4">
        <h2 className="mb-4 text-base font-bold">スペースレイアウト設定</h2>
        <p className="text-muted-foreground mb-4 text-xs">
          配置モードを選択してスペースをクリックすると種類を変更できます
        </p>

        {/* Space Type Selector */}
        <div className="bg-muted mb-4 flex items-center gap-2 rounded-lg p-3">
          <span className="text-muted-foreground mr-1 text-xs">配置モード:</span>
          {PLACEMENT_BUTTONS.map((btn) => (
            <Button
              key={btn.mode}
              variant="outline"
              size="sm"
              onClick={() => setSelectedMode(btn.mode)}
              className={`h-7 px-3 text-xs ${selectedMode === btn.mode ? btn.active : btn.idle}`}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Grid Size Settings */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">列数:</Label>
            <Select value={String(columns)} onValueChange={handleColumnsChange}>
              <SelectTrigger className="h-8 w-16 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-xs">行数:</Label>
            <Select value={String(rows)} onValueChange={handleRowsChange}>
              <SelectTrigger className="h-8 w-16 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROW_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-primary ml-auto h-auto p-0 text-xs"
            onClick={handleReset}
          >
            <RotateCcw className="mr-1 size-3" />
            リセット
          </Button>
        </div>

        {/* Space Grid Editor */}
        <div
          className="mb-4 grid justify-center gap-1"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 2.5rem))`,
          }}
        >
          {gridCells.map((cell, idx) => (
            <div
              key={`${cell.x}-${cell.y}`}
              onClick={() => handleCellClick(cell.x, cell.y)}
              className={CELL_STYLES[cell.kind]}
            >
              {cell.kind === 'normal_seat'
                ? idx + 1
                : cell.kind === 'equipment_seat'
                  ? '器材'
                  : cell.kind === 'fixed_object'
                    ? '柱'
                    : ''}
            </div>
          ))}
        </div>

        {/* Summary Info */}
        <div
          className={cn(
            'rounded-lg border p-3 text-sm',
            error ? 'bg-destructive/5 border-destructive/30' : 'bg-primary/5 border-primary/10',
          )}
        >
          <LayoutFormMessage error={error} />
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground">総スペース数:</span>
            <span className="font-medium">{gridCells.length}</span>
          </div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground">予約可能スペース:</span>
            <span className="text-primary font-medium">{typeCounts.available}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">利用不可スペース:</span>
            <span className="text-muted-foreground font-medium">
              {typeCounts.equipment + typeCounts.pillar}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Legend */}
      <div className="bg-muted/50 text-muted-foreground flex flex-wrap items-center gap-3 rounded-b-xl border-t px-4 py-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="bg-success/10 border-success/20 size-3 rounded border" /> 通常席 (
          {typeCounts.available})
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-warning/15 border-warning/20 size-3 rounded border" /> 器材席 (
          {typeCounts.equipment})
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-muted border-border size-3 rounded border" /> 固定物 (
          {typeCounts.pillar})
        </div>
      </div>
    </Card>
  );
}

export function SpaceLayoutEditor() {
  const form = useFormContext<StudioFormValues>();

  return (
    <FormField
      control={form.control}
      name="layout"
      render={({ field, fieldState }) => (
        <FormItem className="w-[440px] shrink-0">
          <FormControl>
            <div tabIndex={-1}>
              <SpaceLayoutEditorContent
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error}
              />
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
