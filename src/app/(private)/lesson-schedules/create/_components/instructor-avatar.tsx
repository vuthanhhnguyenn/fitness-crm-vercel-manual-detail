'use client';

import { useState } from 'react';

import { UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';

interface InstructorAvatarProps {
  photoUrl?: string | null;
  name: string;
  className?: string;
  iconClassName?: string;
}

export function InstructorAvatar({
  photoUrl,
  name,
  className,
  iconClassName,
}: Readonly<InstructorAvatarProps>) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn('bg-muted flex shrink-0 items-center justify-center rounded-full', className)}
    >
      <UserRound className={cn('text-muted-foreground', iconClassName)} />
    </div>
  );
}
