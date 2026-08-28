import { Badge } from '@/components/ui/badge';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InstructorTabsProps {
  studioCount: number;
  ptCount: number;
}

export function InstructorTabs({ studioCount, ptCount }: InstructorTabsProps) {
  return (
    <TabsList variant="line">
      <TabsTrigger value="studio" className="text-sm">
        スタジオインストラクター
        <Badge
          variant="outline"
          className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
        >
          {studioCount}
        </Badge>
      </TabsTrigger>
      <TabsTrigger value="pt" className="text-sm">
        パーソナルトレーナー
        <Badge
          variant="outline"
          className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
        >
          {ptCount}
        </Badge>
      </TabsTrigger>
    </TabsList>
  );
}
