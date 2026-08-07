import { Loader2 } from 'lucide-react';

export function Loading() {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center space-y-4">
      {/* Loading spinner with animation */}
      <Loader2 className="text-primary h-10 w-10 animate-spin" />
      {/* Loading message in Japanese */}
      <p className="text-muted-foreground text-sm font-medium">読み込み中...</p>
    </div>
  );
}
