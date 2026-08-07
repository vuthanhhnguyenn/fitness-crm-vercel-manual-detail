import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { cn } from '@/lib/utils';

import { MASTER_SOURCE_META, type MasterSource } from '../contract-tab.data';

type Props = {
  selected: boolean;
  onToggle: () => void;
  name: string;
  subText: string;
  source: MasterSource;
};

export function DrawerListItem({ selected, onToggle, name, subText, source }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'border-border bg-card flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors',
        selected && 'border-primary bg-primary/5',
      )}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground text-sm font-medium">{name}</p>
          <Badge
            variant="outline"
            className={cn(
              'px-1.5 py-0 text-[10px] font-medium',
              MASTER_SOURCE_META[source].className,
            )}
          >
            {MASTER_SOURCE_META[source].label}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{subText}</p>
      </div>
    </button>
  );
}
