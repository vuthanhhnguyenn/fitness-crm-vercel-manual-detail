import type { MouseEvent } from 'react';

import Link from 'next/link';

import { ChevronLeft } from 'lucide-react';

type BackLinkProps =
  | { label: string; href: string; onClick?: never }
  | { label: string; href?: never; onClick: (event: MouseEvent<HTMLButtonElement>) => void };

const linkClassName =
  'text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs';

/**
 * 1階層戻るナビゲーション（一覧→詳細 / 一覧→フォーム）
 * 2階層以上は shadcn Breadcrumb を使うこと
 *
 * href: 通常のページ遷移。onClick: 遷移前に確認ダイアログなどを挟みたい場合
 */
export function BackLink({ label, href, onClick }: BackLinkProps) {
  const content = (
    <>
      <ChevronLeft className="size-3" />
      {label}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={linkClassName}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={linkClassName}>
      {content}
    </Link>
  );
}
