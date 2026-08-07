import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** BackLink or shadcn Breadcrumb */
  breadcrumb?: ReactNode;
  /** 必須。ページタイトル */
  title: string;
  /** ステータスBadge等。分類Badge等は呼び出し側でフラグメントとして渡す */
  badge?: ReactNode;
  /** ID表記など text-xs muted。タイトル下に配置 */
  subtitle?: string;
  /** ボタン群。空でも min-h-8 で揺れ防止 */
  actions?: ReactNode;
  /**
   * sticky 固定を有効にするか（デフォルト true）
   * SidebarInset > main overflow-auto 構造で main 内 sticky が有効
   */
  sticky?: boolean;
  /**
   * sticky 時の top offset（例: layout header が h-14 なら "top-14"）
   * デフォルトは "top-0"
   */
  stickyTopClassName?: string;
  /**
   * ヘッダーのクラス名
   */
  className?: string;
}

export function PageHeader({
  breadcrumb,
  title,
  badge,
  subtitle,
  actions,
  sticky = true,
  stickyTopClassName = 'top-0',
  className,
}: Readonly<PageHeaderProps>) {
  return (
    <header
      className={
        sticky ? `sticky bg-white ${stickyTopClassName} z-10 border-b backdrop-blur-sm` : 'mb-4'
      }
    >
      <div className={cn('bg-muted/40 px-6 py-4', className)}>
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-xl font-bold">{title}</h1>
            {badge}
          </div>
          <div className="flex min-h-8 shrink-0 items-center gap-2">{actions}</div>
        </div>
        {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
      </div>
    </header>
  );
}
