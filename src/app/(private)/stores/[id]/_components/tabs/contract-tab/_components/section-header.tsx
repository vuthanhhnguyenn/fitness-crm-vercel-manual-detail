import type { ReactNode } from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  count: number;
  onAdd?: () => void;
  action?: ReactNode;
};

export function SectionHeader({ title, count, onAdd, action }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-foreground text-sm font-semibold">
        {title}
        <span className="bg-muted ml-2 rounded-full px-2 py-0.5 text-xs font-medium">
          {count}件
        </span>
      </h3>
      {action ??
        (onAdd ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={onAdd}
          >
            <Plus className="size-3.5" />
            紐づけ追加
          </Button>
        ) : null)}
    </div>
  );
}
