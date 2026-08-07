import { AlertTriangle, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorViewProps {
  title?: string;
  onRetry?: () => void;
}

export function Error({ title = '何らかの問題が発生しました', onRetry }: ErrorViewProps) {
  return (
    <div className="border-destructive/20 bg-destructive/5 flex min-h-[400px] flex-col items-center justify-center rounded-md border p-8 text-center">
      <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
        <AlertTriangle className="text-destructive h-6 w-6" />
      </div>
      <h3 className="text-destructive mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        データの取得中にエラーが発生しました。ネットワーク接続を確認して再度お試しください。
      </p>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="border-destructive/20 hover:bg-destructive/10 mt-6 gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          再試行する
        </Button>
      )}
    </div>
  );
}
