'use client';

export function GridLegend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-[10px]">
      <div className="flex items-center gap-1">
        <div className="bg-chart-2/20 border-chart-2/30 size-3 rounded border" />
        予約済
      </div>
      <div className="flex items-center gap-1">
        <div className="bg-success/10 border-success/20 size-3 rounded border" />
        空き
      </div>
      <div className="flex items-center gap-1">
        <div className="bg-warning/15 border-warning/20 size-3 rounded border" />
        器材席
      </div>
      <div className="flex items-center gap-1">
        <div className="bg-muted border-border size-3 rounded border" />
        固定物（柱）
      </div>
    </div>
  );
}
