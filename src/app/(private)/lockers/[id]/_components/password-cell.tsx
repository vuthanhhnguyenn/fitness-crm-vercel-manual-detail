'use client';

import { useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PasswordCellProps {
  password: string | null;
}

export function PasswordCell({ password }: PasswordCellProps) {
  const [visible, setVisible] = useState(false);

  if (!password) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="w-12 font-mono text-sm">{visible ? password : '••••'}</span>
      <Button
        variant="ghost"
        size="sm"
        className="size-6 p-0"
        onClick={(event) => {
          event.stopPropagation();
          setVisible((current) => !current);
        }}
      >
        {visible ? (
          <EyeOff className="text-muted-foreground size-3" />
        ) : (
          <Eye className="text-muted-foreground size-3" />
        )}
      </Button>
    </div>
  );
}
