'use client';

import { X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface FilterResultProps {
  /** Total items before filter */
  totalCount: number;
  /** Items after filter */
  filteredCount: number;
  /**
   * Active filter labels to display.
   * Pass a string array (e.g. ["\"keyword\"", "ブランド名", "公開中"]) — joined with ・
   * or a pre-built string.
   */
  filterSummary?: string | string[];
  onClear: () => void;
  className?: string;
}

export function FilterResult({
  totalCount,
  filteredCount,
  filterSummary,
  onClear,
  className,
}: Readonly<FilterResultProps>) {
  const summaryText = Array.isArray(filterSummary)
    ? filterSummary.filter(Boolean).join('・')
    : filterSummary;

  return (
    <Alert
      className={cn(
        'flex items-center justify-between gap-4 border-slate-200 bg-white shadow-none',
        className,
      )}
    >
      <AlertDescription className="flex items-center justify-between text-xs">
        全 {totalCount} 件中 <span className="font-medium">{filteredCount} 件</span>
        を抽出中
        {summaryText && <span className="text-muted-foreground ml-1">: {summaryText}</span>}
      </AlertDescription>
      <Button variant="ghost" size="sm" className="h-6 shrink-0 text-xs" onClick={onClear}>
        <X className="mr-1 size-3" />
        条件をクリア
      </Button>
    </Alert>
  );
}
