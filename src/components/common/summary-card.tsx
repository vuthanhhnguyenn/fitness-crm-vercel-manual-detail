import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import { cn } from '@/lib/utils';

export type SummaryCardTone = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'muted';

const TONE_CLASS: Record<SummaryCardTone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
  muted: 'text-muted-foreground',
};

interface SummaryCardProps {
  title: ReactNode;
  /** 主値（数字の本体）。カンマ区切りは呼び出し側で済ませておく */
  value: string;
  /** ¥ / $ などの通貨記号。value より小さく表示される */
  prefix?: string;
  /** 件 / 名 / 回 などの単位。value より小さく表示される */
  suffix?: string;
  /** 下段の補足（内訳・期間など）。文字列またはJSX（リンク等）を渡せる */
  subValue?: ReactNode;
  /** 色（意味ベース） */
  tone?: SummaryCardTone;
  className?: string;
}

export function SummaryCard({
  title,
  value,
  prefix,
  suffix,
  subValue,
  tone = 'default',
  className,
}: Readonly<SummaryCardProps>) {
  return (
    <Card className={cn('gap-0 py-4', className)}>
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs">{title}</p>
        <p className={cn('text-2xl font-semibold tabular-nums', TONE_CLASS[tone])}>
          {prefix && (
            <span className="text-muted-foreground mr-0.5 text-sm font-normal">{prefix}</span>
          )}
          {value}
          {suffix && (
            <span className="text-muted-foreground ml-1 text-sm font-normal">{suffix}</span>
          )}
        </p>
        {subValue &&
          (typeof subValue === 'string' ? (
            <p className="text-muted-foreground mt-1 text-[11px]">{subValue}</p>
          ) : (
            <div className="mt-1">{subValue}</div>
          ))}
      </CardContent>
    </Card>
  );
}
