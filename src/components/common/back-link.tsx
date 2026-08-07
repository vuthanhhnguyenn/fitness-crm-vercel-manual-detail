import Link from 'next/link';

import { ChevronLeft } from 'lucide-react';

interface BackLinkProps {
  label: string;
  href: string;
}

/**
 * 1階層戻るナビゲーション（一覧→詳細 / 一覧→フォーム）
 * 2階層以上は shadcn Breadcrumb を使うこと
 */
export function BackLink({ label, href }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs"
    >
      <ChevronLeft className="size-3" />
      {label}
    </Link>
  );
}
