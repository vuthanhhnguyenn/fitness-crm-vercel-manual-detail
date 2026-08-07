import Link from 'next/link';

import { ShieldOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { routes } from '@/lib/routes/routes.config';

export default function ForbiddenPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Icon */}
      <div className="bg-destructive/10 flex size-20 items-center justify-center rounded-full">
        <ShieldOff className="text-destructive size-10" />
      </div>

      {/* Status code */}
      <p className="text-muted-foreground/20 text-8xl font-black tracking-tight select-none">403</p>

      {/* Heading */}
      <div className="-mt-4 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">アクセス権限がありません</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          このページを表示する権限がありません。
          <br />
          必要な場合は管理者にお問い合わせください。
        </p>
      </div>

      {/* Action */}
      <Button render={<Link href={routes['/'].router} />}>ホームに戻る</Button>
    </div>
  );
}
