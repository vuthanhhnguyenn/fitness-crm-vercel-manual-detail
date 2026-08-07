import { Inbox } from 'lucide-react';

interface EmptyViewProps {
  title?: string;
  description?: string;
}

export function Empty({
  title = 'データが見つかりません', // Default: No data found
  description = '表示する項目がありません。', // Default: No items to display
}: EmptyViewProps) {
  return (
    <div className="animate-in fade-in-50 flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
        <Inbox className="text-muted-foreground h-10 w-10" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mx-auto mt-2 mb-4 max-w-xs text-sm">{description}</p>
    </div>
  );
}
