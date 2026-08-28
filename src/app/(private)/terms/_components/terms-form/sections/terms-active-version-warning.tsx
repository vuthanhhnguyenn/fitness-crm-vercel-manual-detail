import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

export function TermsActiveVersionWarning() {
  return (
    <div className="mx-auto mb-6 max-w-240">
      <Alert className="border-warning/50 bg-warning/15">
        <AlertTriangle className="text-warning size-4" />
        <AlertDescription className="text-muted-foreground text-xs">
          適用中の規約を変更すると、同意済みの会員にも影響します。通常は新バージョンの作成を推奨します。
        </AlertDescription>
      </Alert>
    </div>
  );
}
