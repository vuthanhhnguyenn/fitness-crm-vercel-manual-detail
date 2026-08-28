import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function EnrollmentRouteSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>入会経路</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-center gap-3">
          <div className="border-input bg-muted/50 flex h-8 items-center rounded-md border px-3 text-sm font-medium">
            手動
          </div>
          <p className="text-muted-foreground text-xs">
            管理画面からの入会は入会経路「手動」が自動付与されます。申請種別の選択は不要です。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
