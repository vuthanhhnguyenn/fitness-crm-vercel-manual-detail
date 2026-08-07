import Link from 'next/link';

import type { LayoutPreview } from '@/app/api/_schemas/studio-detail.schema';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudioLayoutCardProps {
  layout: LayoutPreview;
}

function LayoutCell({ kind }: { kind: string }) {
  const base = 'size-12 rounded flex items-center justify-center text-xs font-medium border';
  switch (kind) {
    case 'normal_seat':
      return (
        <div className={`${base} bg-success/10 text-success border-success/20`}>
          {/* seat indicator */}
        </div>
      );
    case 'equipment_seat':
      return <div className={`${base} bg-warning/15 text-warning border-warning/20`}>器材</div>;
    case 'fixed_object':
      return <div className={`${base} bg-muted text-muted-foreground border-border`}>固定</div>;
    default:
      return <div className={`${base} bg-background border-dashed`} />;
  }
}

export function StudioLayoutCard({ layout }: StudioLayoutCardProps) {
  if (layout.state === 'not_configured') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">スペースレイアウト</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 py-8">
            <p className="text-muted-foreground mb-4 text-center text-sm">
              レイアウト情報が未設定です
            </p>
            <Link href={layout.configure_path}>
              <Button size="sm" variant="outline">
                レイアウトを設定する
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!layout.rows || !layout.columns || !layout.cells) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">スペースレイアウト</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">
            レイアウト情報が利用できません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle className="text-base font-semibold">スペースレイアウト</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div
          className="grid justify-center gap-2"
          style={{
            gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 3rem))`,
          }}
        >
          {layout.cells.map((cell) => (
            <LayoutCell key={`${cell.x}-${cell.y}`} kind={cell.kind} />
          ))}
        </div>
      </CardContent>
      <div className="bg-muted/50 text-muted-foreground flex flex-wrap items-center gap-3 rounded-b-xl border-t px-4 py-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="bg-success/10 border-success/20 size-3 rounded border" /> 通常席
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-warning/15 border-warning/20 size-3 rounded border" /> 器材席
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-muted border-border size-3 rounded border" /> 固定物
        </div>
      </div>
    </Card>
  );
}
