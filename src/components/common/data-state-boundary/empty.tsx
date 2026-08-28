'use client';

import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';
import { PackageOpen, SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type EmptyProps = {
  /** 「フィルター/検索で0件」か「元からデータなし」かを切り替える */
  variant?: 'filtered' | 'empty';
  /** アイコン（lucide-react）。variant に応じたデフォルトあり */
  icon?: LucideIcon;
  /** 見出し。省略時は variant から自動生成 */
  title?: string;
  /** 補足説明 */
  description?: string;
  /** 対象エンティティの呼称（例: "会員"、"お知らせ"） */
  entityLabel?: string;
  /** 主アクションのハンドラ。既定スタイルの outline ボタンを描画する */
  onAction?: () => void;
  /** 主アクションのラベル。省略時は「条件をクリア」 */
  actionLabel?: string;
  /**
   * 主アクションを任意の要素で差し替える escape hatch。
   * 権限ゲート付きボタンやアイコン付きボタンなど、`onAction` の既定スタイルでは
   * 表現できない場合にのみ使う。指定時は `onAction` より優先される。
   */
  action?: ReactNode;
};

/**
 * テーブル0件表示共通コンポーネント。
 *
 * - variant="filtered": 「条件に一致する{entityLabel}がありません」＋条件クリアアクション
 * - variant="empty":    「{entityLabel}がまだありません」＋新規登録アクション
 */
export function Empty({
  variant = 'filtered',
  icon: Icon,
  title,
  description,
  entityLabel,
  onAction,
  actionLabel = '条件をクリア',
  action,
}: EmptyProps) {
  const DefaultIcon = variant === 'filtered' ? SearchX : PackageOpen;
  const ResolvedIcon = Icon ?? DefaultIcon;

  const defaultTitle =
    title ??
    (variant === 'filtered'
      ? `条件に一致する${entityLabel ?? 'データ'}がありません`
      : `${entityLabel ?? 'データ'}がまだありません`);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <ResolvedIcon className="text-muted-foreground/40 size-8" strokeWidth={1.5} />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-muted-foreground text-sm font-medium">{defaultTitle}</p>
        {description && <p className="text-muted-foreground/70 text-xs">{description}</p>}
      </div>
      {action ??
        (onAction ? (
          <Button variant="outline" size="sm" className="text-xs" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : undefined)}
    </div>
  );
}
