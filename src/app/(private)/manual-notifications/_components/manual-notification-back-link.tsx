import type { MouseEventHandler } from 'react';

import Link from 'next/link';

import { ChevronLeft } from 'lucide-react';

interface ManualNotificationBackLinkProps {
  readonly label: string;
  readonly href: string;
  readonly onClick: MouseEventHandler<HTMLAnchorElement>;
}

export function ManualNotificationBackLink({
  label,
  href,
  onClick,
}: ManualNotificationBackLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-xs"
    >
      <ChevronLeft className="size-3" />
      {label}
    </Link>
  );
}
